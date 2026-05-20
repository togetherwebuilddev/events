import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TableContainer,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { guestsApi } from '../api/guestsApi';
import { eventsApi } from '../../events/api/eventsApi';
import { EventDto } from '../../events/types/event';
import { BulkInvitationDialog } from '../components/BulkInvitationDialog';
import { GuestFormDialog } from '../components/GuestFormDialog';
import { GuestsTable } from '../components/GuestsTable';
import { RegistrationDialog } from '../components/RegistrationDialog';
import {
  BulkInvitationSendResultDto,
  EventRegistrationDto,
  GuestDto,
  GuestFormValues,
  InvitationSendResultDto,
} from '../types/guest';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { ErrorAlert } from '../../../reusable/feedback/ErrorAlert';
import { LoadingState } from '../../../reusable/feedback/LoadingState';
import { EmptyState } from '../../../reusable/table/EmptyState';
import { getApiErrorMessage } from '../../../api/utils/getApiErrorMessage';
import './GuestsListPage.css';

const DEFAULT_PAGE = 0;
const DEFAULT_ROWS_PER_PAGE = 10;

function mapFormValuesToRequest(values: GuestFormValues) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    company: values.company.trim(),
    notes: values.notes.trim(),
  };
}

function paginateGuests(guests: GuestDto[], page: number, size: number) {
  const startIndex = page * size;
  const items = guests.slice(startIndex, startIndex + size);

  return {
    items,
    totalItems: guests.length,
  };
}

function mapKnownApiError(error: unknown, fallbackMessage: string) {
  return getApiErrorMessage(error, fallbackMessage, {
    'guest.delete.blocked.history': 'Gost ima istoriju prijava i ne moze biti obrisan iz baze.',
    'registration.already.exists': 'Gost je vec prijavljen na ovaj dogadjaj.',
    'guest.notfound': 'Gost nije pronadjen.',
    'registration.notfound': 'Prijava za dogadjaj nije pronadjena.',
  });
}

function buildEmailSummaryText(
  results: InvitationSendResultDto[],
  mode: 'single' | 'bulk'
) {
  const sentEmails = results.filter((result) => result.success && !result.skipped).map((result) => result.emailTo).filter(Boolean);
  const skippedEmails = results.filter((result) => result.skipped).map((result) => result.emailTo).filter(Boolean);
  const failedEmails = results.filter((result) => !result.success).map((result) => result.emailTo).filter(Boolean);

  const parts: string[] = [];

  if (sentEmails.length > 0) {
    parts.push(
      mode === 'single'
        ? `Pozivnica je uspesno poslata na ${sentEmails.join(', ')}.`
        : `Uspesno poslato: ${sentEmails.join(', ')}.`
    );
  }

  if (skippedEmails.length > 0) {
    parts.push(
      mode === 'single'
        ? `Pozivnica je vec poslata na ${skippedEmails.join(', ')} za ovaj dogadjaj.`
        : `Vec poslato za ovaj dogadjaj: ${skippedEmails.join(', ')}.`
    );
  }

  if (failedEmails.length > 0) {
    parts.push(`Nije uspelo slanje za: ${failedEmails.join(', ')}.`);
  }

  return parts.join(' ');
}

function buildBulkEmailMessage(result: BulkInvitationSendResultDto) {
  const summary = `Poslato: ${result.successCount}, vec poslato: ${result.skippedCount}, neuspesno: ${result.failedCount}.`;
  const details = buildEmailSummaryText(result.results, 'bulk');
  return `${summary} ${details}`.trim();
}

function buildEmailFailureReason(
  registrationId: number,
  registrations: EventRegistrationDto[],
  fallbackMessage: string
) {
  return (
    registrations.find((registration) => registration.id === registrationId)?.invitationErrorMessage ??
    fallbackMessage
  );
}

function buildBulkEmailFailureDetails(
  result: BulkInvitationSendResultDto,
  registrations: EventRegistrationDto[]
) {
  const failedMessages = result.results
    .filter((item) => !item.success && typeof item.registrationId === 'number')
    .map((item) =>
      buildEmailFailureReason(
        item.registrationId as number,
        registrations,
        item.message || 'Email nije poslat.'
      )
    )
    .filter(Boolean);

  if (failedMessages.length === 0) {
    return 'Email nije poslat.';
  }

  return Array.from(new Set(failedMessages)).join(' ');
}

export function GuestsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [events, setEvents] = useState<EventDto[]>([]);
  const [event, setEvent] = useState<EventDto | null>(null);
  const [allGuests, setAllGuests] = useState<GuestDto[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistrationDto[]>([]);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkSendError, setBulkSendError] = useState<string | null>(null);
  const [emailSendingId, setEmailSendingId] = useState<number | null>(null);
  const [unregisteringRegistrationId, setUnregisteringRegistrationId] = useState<number | null>(null);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const debouncedSearchTerm = useDebouncedValue(searchTerm);
  const debouncedEventSearchTerm = useDebouncedValue(eventSearchTerm);

  useEffect(() => {
    if (!actionSuccess && !actionError && !deleteError) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionSuccess(null);
      setActionError(null);
      setDeleteError(null);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [actionSuccess, actionError, deleteError]);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearchTerm, eventId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [eventsResponse, guestsResponse, registrationsResponse, selectedEventResponse] =
          await Promise.all([
            eventsApi.getEvents(0, 100, debouncedEventSearchTerm),
            guestsApi.getGuestOptions(),
            guestsApi.getAllRegistrations(),
            eventId ? eventsApi.getEvent(eventId) : Promise.resolve(null),
          ]);

        setEvents(eventsResponse.items);
        setAllGuests(guestsResponse);
        setRegistrations(registrationsResponse);
        setEvent(selectedEventResponse);
      } catch (loadError) {
        setError(mapKnownApiError(loadError, 'Neuspesno ucitavanje gostiju i dogadjaja.'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [debouncedEventSearchTerm, eventId]);

  const registrationsForSelectedEvent = useMemo(
    () =>
      registrations.filter(
        (registration) =>
          String(registration.eventId) === eventId && !registration.canceledAt
      ),
    [eventId, registrations]
  );

  const registrationsByGuestId = useMemo(
    () =>
      registrationsForSelectedEvent.reduce<Record<number, EventRegistrationDto>>((acc, registration) => {
        acc[registration.guestId] = registration;
        return acc;
      }, {}),
    [registrationsForSelectedEvent]
  );

  const guestsForSelectedEvent = useMemo(() => {
    if (!eventId) {
      return [];
    }

    return allGuests.filter((guest) => registrationsByGuestId[guest.id]);
  }, [allGuests, eventId, registrationsByGuestId]);

  const guestsWithoutEvent = useMemo(() => {
    const assignedGuestIds = new Set(
      registrations
        .filter((registration) => !registration.canceledAt)
        .map((registration) => registration.guestId)
    );
    return allGuests.filter((guest) => !assignedGuestIds.has(guest.id));
  }, [allGuests, registrations]);

  const filteredGuests = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();
    const sourceGuests = eventId ? guestsForSelectedEvent : guestsWithoutEvent;

    if (!normalizedSearch) {
      return sourceGuests;
    }

    return sourceGuests.filter((guest) =>
      [guest.firstName, guest.lastName, guest.email, guest.company]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [debouncedSearchTerm, eventId, guestsForSelectedEvent, guestsWithoutEvent]);

  const paginatedGuests = useMemo(
    () => paginateGuests(filteredGuests, page, rowsPerPage),
    [filteredGuests, page, rowsPerPage]
  );

  useEffect(() => {
    setSelectedGuestIds((currentIds) =>
      currentIds.filter((guestId) => paginatedGuests.items.some((guest) => guest.id === guestId))
    );
  }, [paginatedGuests.items]);

  const selectedRegistrationIds = selectedGuestIds
    .map((guestId) => registrationsByGuestId[guestId]?.id)
    .filter((registrationId): registrationId is number => Boolean(registrationId));

  const filteredRegistrationIds = filteredGuests
    .map((guest) => registrationsByGuestId[guest.id]?.id)
    .filter((registrationId): registrationId is number => Boolean(registrationId));

  const effectiveDownloadRegistrationIds =
    selectedRegistrationIds.length > 0 ? selectedRegistrationIds : filteredRegistrationIds;

  const eventGuestCounts = useMemo(
    () =>
      registrations.reduce<Record<number, number>>((acc, registration) => {
        if (!registration.canceledAt) {
          acc[registration.eventId] = (acc[registration.eventId] ?? 0) + 1;
        }
        return acc;
      }, {}),
    [registrations]
  );

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      setDeleteError(null);
      await guestsApi.deleteGuest(id);
      setAllGuests((currentGuests) => currentGuests.filter((guest) => guest.id !== id));
      setRegistrations((currentRegistrations) =>
        currentRegistrations.filter((registration) => registration.guestId !== id)
      );
      setSelectedGuestIds((currentIds) => currentIds.filter((guestId) => guestId !== id));
    } catch (deleteRequestError) {
      setDeleteError(mapKnownApiError(deleteRequestError, 'Brisanje gosta nije uspelo.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingGuest(null);
    setSubmitError(null);
  };

  const handleCreateClick = () => {
    setEditingGuest(null);
    setDialogOpen(true);
    setSubmitError(null);
  };

  const handleEditClick = (guest: GuestDto) => {
    setEditingGuest(guest);
    setDialogOpen(true);
    setSubmitError(null);
  };

  const handleSubmit = async (values: GuestFormValues) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      let savedGuest: GuestDto;
      let createdRegistration: EventRegistrationDto | null = null;

      if (editingGuest) {
        savedGuest = await guestsApi.updateGuest(editingGuest.id, mapFormValuesToRequest(values));
      } else {
        savedGuest = await guestsApi.createGuest(mapFormValuesToRequest(values));
      }

      if (!editingGuest && eventId) {
        createdRegistration = await guestsApi.createEventRegistration(eventId, {
          guestId: savedGuest.id,
          notes: '',
        });
      }

      setAllGuests((currentGuests) => {
        if (editingGuest) {
          return currentGuests.map((guest) => (guest.id === savedGuest.id ? savedGuest : guest));
        }

        return [savedGuest, ...currentGuests];
      });

      if (createdRegistration) {
        const registrationToAdd = createdRegistration;
        setRegistrations((currentRegistrations) => [registrationToAdd, ...currentRegistrations]);
      }

      handleDialogClose();
      setActionSuccess(
        !editingGuest && eventId
          ? 'Gost je dodat i prijavljen na izabrani dogadjaj.'
          : 'Gost je uspesno sacuvan.'
      );
    } catch (submitRequestError) {
      setSubmitError(mapKnownApiError(submitRequestError, 'Cuvanje gosta nije uspelo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(DEFAULT_PAGE);
  };

  const handleSearchTermChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleEventSearchTermChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEventSearchTerm(event.target.value);
  };

  const handleToggleSelection = (guestId: number) => {
    setSelectedGuestIds((currentIds) =>
      currentIds.includes(guestId)
        ? currentIds.filter((currentId) => currentId !== guestId)
        : [...currentIds, guestId]
    );
  };

  const handleToggleSelectAll = (guestIds: number[]) => {
    const areAllSelected = guestIds.every((guestId) => selectedGuestIds.includes(guestId));

    setSelectedGuestIds((currentIds) =>
      areAllSelected
        ? currentIds.filter((guestId) => !guestIds.includes(guestId))
        : Array.from(new Set([...currentIds, ...guestIds]))
    );
  };

  const handleSendSingleEmail = async (registrationId: number) => {
    if (!eventId) {
      return;
    }

    try {
      setEmailSendingId(registrationId);
      setActionError(null);
      setActionSuccess(null);
      const result = await guestsApi.sendRegistrationEmail(eventId, registrationId);
      const latestRegistrations = await guestsApi.getAllRegistrations();
      setRegistrations(latestRegistrations);

      if (!result.success) {
        setActionError(
          buildEmailFailureReason(
            registrationId,
            latestRegistrations,
            result.message || 'Pojedinacno slanje emaila nije uspelo.'
          )
        );
        return;
      }

      setActionSuccess(buildEmailSummaryText([result], 'single'));
    } catch (sendError) {
      setActionError(mapKnownApiError(sendError, 'Pojedinacno slanje emaila nije uspelo.'));
    } finally {
      setEmailSendingId(null);
    }
  };

  const handleBulkInvitationSend = async (subject: string, body: string) => {
    if (!eventId || selectedRegistrationIds.length === 0) {
      return;
    }

    try {
      setIsSendingBulk(true);
      setBulkSendError(null);
      setActionError(null);
      setActionSuccess(null);
      const result = await guestsApi.sendBulkRegistrationEmails(selectedRegistrationIds, subject, body);
      const latestRegistrations = await guestsApi.getAllRegistrations();
      setRegistrations(latestRegistrations);
      setBulkDialogOpen(false);

      if (result.failedCount > 0) {
        setActionError(buildBulkEmailFailureDetails(result, latestRegistrations));
      }

      setActionSuccess(buildBulkEmailMessage(result));
    } catch (sendError) {
      setBulkSendError(mapKnownApiError(sendError, 'Grupno slanje emailova nije uspelo.'));
    } finally {
      setIsSendingBulk(false);
    }
  };

  const handleUnregisterGuest = async (registrationId: number) => {
    try {
      setUnregisteringRegistrationId(registrationId);
      setActionError(null);
      setActionSuccess(null);
      await guestsApi.cancelEventRegistration(registrationId);
      setActionSuccess('Gost je uklonjen sa izabranog dogadjaja i premesten medju goste bez eventa.');
      setRegistrations((currentRegistrations) =>
        currentRegistrations.map((registration) =>
          registration.id === registrationId
            ? {
                ...registration,
                canceledAt: new Date().toISOString(),
              }
            : registration
        )
      );
      setSelectedGuestIds((currentIds) =>
        currentIds.filter((guestId) => registrationsByGuestId[guestId]?.id !== registrationId)
      );
    } catch (removeError) {
      setActionError(
        mapKnownApiError(removeError, 'Uklanjanje gosta sa dogadjaja nije uspelo.')
      );
    } finally {
      setUnregisteringRegistrationId(null);
    }
  };

  const handleDownloadSingleQr = async (registrationId: number) => {
    try {
      setActionError(null);
      await guestsApi.downloadRegistrationQrPng(registrationId);
    } catch (downloadError) {
      setActionError(mapKnownApiError(downloadError, 'Preuzimanje PNG QR koda nije uspelo.'));
    }
  };

  const handleDownloadSinglePdf = async (registrationId: number) => {
    try {
      setActionError(null);
      await guestsApi.downloadRegistrationTicketPdf(registrationId);
    } catch (downloadError) {
      setActionError(mapKnownApiError(downloadError, 'Preuzimanje PDF ulaznice nije uspelo.'));
    }
  };

  const handleBulkDownload = async (type: 'png' | 'pdf') => {
    const registrationIds = effectiveDownloadRegistrationIds;

    if (registrationIds.length === 0) {
      return;
    }

    try {
      setIsDownloadingBulk(true);
      setActionError(null);
      const eventFilePart = event?.name?.trim().toLowerCase().replace(/\s+/g, '-') || 'dogadjaj';
      const scope = selectedRegistrationIds.length > 0 ? 'izabrani' : 'svi-sa-liste';
      const fileName = `${eventFilePart}-${scope}-${type}.zip`;

      if (type === 'png') {
        await guestsApi.downloadBulkQrArchive(registrationIds, fileName);
      } else {
        await guestsApi.downloadBulkPdfArchive(registrationIds, fileName);
      }
    } catch (downloadError) {
      setActionError(
        mapKnownApiError(
          downloadError,
          type === 'png'
            ? 'Grupno preuzimanje PNG QR kodova nije uspelo.'
            : 'Grupno preuzimanje PDF ulaznica nije uspelo.'
        )
      );
    } finally {
      setIsDownloadingBulk(false);
    }
  };

  const handleRegisterExistingGuest = async (guestId: number, notes: string) => {
    if (!eventId) {
      return;
    }

    try {
      setIsRegistering(true);
      setRegisterError(null);
      const createdRegistration = await guestsApi.createEventRegistration(eventId, {
        guestId,
        notes: notes.trim(),
      });
      setRegisterDialogOpen(false);
      setActionSuccess('Gost je uspesno prijavljen na izabrani dogadjaj.');
      setRegistrations((currentRegistrations) => [createdRegistration, ...currentRegistrations]);
    } catch (registerRequestError) {
      setRegisterError(
        mapKnownApiError(registerRequestError, 'Prijava gosta na dogadjaj nije uspela.')
      );
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <Stack spacing={3}>
        <Box className="guests-list-page__header">
          <Box>
            <Typography variant="overline" className="guests-list-page__eyebrow">
              BAZA GOSTIJU
            </Typography>
            <Typography variant="h4" className="guests-list-page__title">
              Gosti
            </Typography>
            <Typography color="text.secondary" className="guests-list-page__subtitle">
              {event
                ? `Upravljanje gostima za dogadjaj: ${event.name}`
                : 'Izaberite dogadjaj ili upravljajte gostima koji trenutno nemaju aktivan dogadjaj.'}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {event ? (
              <>
                <Button variant="outlined" onClick={() => navigate('/admin/guests')}>
                  Svi dogadjaji
                </Button>
                <Button variant="outlined" onClick={() => setRegisterDialogOpen(true)}>
                  Dodaj iz baze
                </Button>
              </>
            ) : null}
            <Button onClick={handleCreateClick}>
              {event ? 'Novi gost za dogadjaj' : 'Novi gost bez eventa'}
            </Button>
          </Stack>
        </Box>

        {!event ? (
          <>
            <Box className="guests-list-page__filters guests-list-page__surface">
              <TextField
                label="Pretraga dogadjaja"
                placeholder="Pretrazi po nazivu ili lokaciji"
                value={eventSearchTerm}
                onChange={handleEventSearchTermChange}
                className="guests-list-page__search"
              />
            </Box>

            <Box className="guests-list-page__events-grid">
              {events.map((currentEvent) => (
                <Paper key={currentEvent.id} variant="outlined" className="guests-list-page__event-card">
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6">{currentEvent.name}</Typography>
                      <Typography color="text.secondary">{currentEvent.location}</Typography>
                    </Box>
                    <Typography variant="body2">
                      Broj gostiju: {eventGuestCounts[currentEvent.id] ?? 0}
                    </Typography>
                    <Button onClick={() => navigate(`/admin/guests?eventId=${currentEvent.id}`)}>
                      Otvori goste
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </>
        ) : null}

        <Box className="guests-list-page__filters guests-list-page__surface">
          <TextField
            label={event ? 'Pretraga gostiju za dogadjaj' : 'Pretraga gostiju bez aktivnog dogadjaja'}
            placeholder="Pretrazi po imenu, emailu ili kompaniji"
            value={searchTerm}
            onChange={handleSearchTermChange}
            className="guests-list-page__search"
          />
        </Box>

        {error ? <ErrorAlert message={error} /> : null}
        {event ? (
          <Box className="guests-list-page__event-actions">
            <Box>
              <Typography variant="h6">Akcije za izabrani dogadjaj</Typography>
              <Typography color="text.secondary">
                Izabrano gostiju za grupni email: {selectedRegistrationIds.length}
              </Typography>
              <Typography color="text.secondary">
                Na trenutnoj listi gostiju: {filteredRegistrationIds.length}
              </Typography>
              <Typography color="text.secondary">
                Za download se koriste {selectedRegistrationIds.length > 0 ? 'cekirani gosti' : 'svi gosti sa trenutne liste'}.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} className="guests-list-page__event-action-buttons">
              <Button
                variant="outlined"
                onClick={() => void handleBulkDownload('png')}
                disabled={effectiveDownloadRegistrationIds.length === 0 || isDownloadingBulk}
              >
                Preuzmi PNG
              </Button>
              <Button
                variant="outlined"
                onClick={() => void handleBulkDownload('pdf')}
                disabled={effectiveDownloadRegistrationIds.length === 0 || isDownloadingBulk}
              >
                Preuzmi PDF
              </Button>
              <Button
                onClick={() => setBulkDialogOpen(true)}
                disabled={selectedRegistrationIds.length === 0}
              >
                Posalji email izabranima
              </Button>
            </Stack>
          </Box>
        ) : null}

        {!error && filteredGuests.length === 0 ? (
          <EmptyState
            title={event ? 'Nema gostiju za izabrani dogadjaj' : 'Nema gostiju bez eventa'}
            description={
              event
                ? 'Dodajte novog gosta ili prijavite postojeceg gosta iz baze na ovaj dogadjaj.'
                : 'Ovde ce biti prikazani gosti koji nemaju nijednu aktivnu prijavu na dogadjaj.'
            }
          />
        ) : null}

        {!error && filteredGuests.length > 0 ? (
          <Box className="guests-list-page__table-wrapper guests-list-page__surface">
            <TableContainer>
              <GuestsTable
                guests={paginatedGuests.items}
                deletingId={deletingId}
                selectedGuestIds={selectedGuestIds}
                registrationsByGuestId={registrationsByGuestId}
                showEventActions={Boolean(eventId)}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onToggleSelection={handleToggleSelection}
                onToggleSelectAll={handleToggleSelectAll}
                onSendEmail={handleSendSingleEmail}
                onDownloadQr={handleDownloadSingleQr}
                onDownloadPdf={handleDownloadSinglePdf}
                onUnregister={handleUnregisterGuest}
                emailSendingId={emailSendingId}
                unregisteringRegistrationId={unregisteringRegistrationId}
              />
            </TableContainer>
            <TablePagination
              component="div"
              count={paginatedGuests.totalItems}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Box>
        ) : null}
      </Stack>

      <GuestFormDialog
        open={dialogOpen}
        guest={editingGuest}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
      />
      <BulkInvitationDialog
        open={bulkDialogOpen}
        title="Grupno slanje emaila"
        selectedCount={selectedRegistrationIds.length}
        isSubmitting={isSendingBulk}
        submitError={bulkSendError}
        onClose={() => {
          setBulkDialogOpen(false);
          setBulkSendError(null);
        }}
        onSubmit={handleBulkInvitationSend}
      />
      <RegistrationDialog
        open={registerDialogOpen}
        guests={guestsWithoutEvent}
        isSubmitting={isRegistering}
        submitError={registerError}
        onClose={() => {
          setRegisterDialogOpen(false);
          setRegisterError(null);
        }}
        onSubmit={handleRegisterExistingGuest}
      />
      <Snackbar
        open={Boolean(deleteError)}
        autoHideDuration={4000}
        onClose={() => setDeleteError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(actionError)}
        autoHideDuration={4000}
        onClose={() => setActionError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(actionSuccess)}
        autoHideDuration={4000}
        onClose={() => setActionSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      </Snackbar>
    </>
  );
}
