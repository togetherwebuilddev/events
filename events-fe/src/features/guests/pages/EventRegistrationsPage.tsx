import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  TableContainer,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi } from '../../events/api/eventsApi';
import { EventDto } from '../../events/types/event';
import { guestsApi } from '../api/guestsApi';
import { EventRegistrationsTable } from '../components/EventRegistrationsTable';
import { QrScannerDialog } from '../components/QrScannerDialog';
import { AttendanceStatus, EventRegistrationDto } from '../types/guest';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useAuth } from '../../auth/context/AuthContext';
import { ErrorAlert } from '../../../reusable/feedback/ErrorAlert';
import { LoadingState } from '../../../reusable/feedback/LoadingState';
import { EmptyState } from '../../../reusable/table/EmptyState';
import './EventRegistrationsPage.css';

const DEFAULT_PAGE = 0;
const DEFAULT_ROWS_PER_PAGE = 10;
const ATTENDANCE_FILTER_OPTIONS: Array<{ value: AttendanceStatus | ''; label: string }> = [
  { value: '', label: 'Svi gosti' },
  { value: 'NOT_ARRIVED', label: 'Nisu dosli' },
  { value: 'CHECKED_IN', label: 'Dosli preko QR-a' },
  { value: 'MANUAL_CHECKED_IN', label: 'Dosli rucno' },
];

type SummaryMetrics = {
  notArrived: number;
  totalArrived: number;
  qrArrivals: number;
  manualArrivals: number;
  canceled: number;
};

function getGuestDisplayName(registration: EventRegistrationDto) {
  return `${registration.guestFirstName} ${registration.guestLastName}`.trim();
}

function getSummaryMetrics(registrations: EventRegistrationDto[]): SummaryMetrics {
  return registrations.reduce(
    (metrics, registration) => {
      if (registration.canceledAt) {
        metrics.canceled += 1;
        return metrics;
      }

      if (registration.attendanceStatus === 'NOT_ARRIVED') {
        metrics.notArrived += 1;
      }

      if (registration.attendanceStatus === 'CHECKED_IN') {
        metrics.totalArrived += 1;
        metrics.qrArrivals += 1;
      }

      if (registration.attendanceStatus === 'MANUAL_CHECKED_IN') {
        metrics.totalArrived += 1;
        metrics.manualArrivals += 1;
      }

      return metrics;
    },
    {
      notArrived: 0,
      totalArrived: 0,
      qrArrivals: 0,
      manualArrivals: 0,
      canceled: 0,
    }
  );
}

export function EventRegistrationsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [event, setEvent] = useState<EventDto | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistrationDto[]>([]);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | ''>('');
  const [qrCode, setQrCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  useEffect(() => {
    if (!actionSuccess && !actionError) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionSuccess(null);
      setActionError(null);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [actionSuccess, actionError]);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    void (async () => {
      if (!id) {
        setError('Dogadjaj nije pronadjen.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const [eventResponse, registrationsResponse] = await Promise.all([
          eventsApi.getEvent(id),
          guestsApi.getAllRegistrations(),
        ]);

        setEvent(eventResponse);
        setRegistrations(
          registrationsResponse.filter((registration) => String(registration.eventId) === id)
        );
      } catch (loadError) {
        setError('Neuspesno ucitavanje registracija za dogadjaj.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const activeRegistrations = registrations.filter((registration) => !registration.canceledAt);

  const filteredRegistrations = activeRegistrations.filter((registration) => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

    const matchesSearch = !normalizedSearch
      ? true
      : [
          registration.guestFirstName,
          registration.guestLastName,
          registration.guestEmail,
          registration.eventName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

    const matchesStatus = statusFilter
      ? registration.attendanceStatus === statusFilter
      : true;

    return matchesSearch && matchesStatus;
  });

  const paginatedRegistrations = filteredRegistrations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const findRegistrationForCheckIn = (
    registrationId: number | null | undefined,
    scannedToken?: string
  ) =>
    registrations.find(
      (registration) =>
        registration.id === registrationId ||
        (scannedToken ? registration.qrToken === scannedToken : false)
    );

  const handleCheckIn = async (registrationId: number) => {
    if (!id) {
      return;
    }

    try {
      setCheckingInId(registrationId);
      setActionError(null);
      setActionSuccess(null);
      const response = await guestsApi.checkInRegistration(id, registrationId);
      const matchedRegistration = findRegistrationForCheckIn(registrationId);
      setActionSuccess(
        matchedRegistration
          ? `${getGuestDisplayName(matchedRegistration)} | ${matchedRegistration.eventName}`
          : event?.name ?? 'Dogadjaj'
      );
      setRegistrations((currentRegistrations) =>
        currentRegistrations.map((registration) =>
          registration.id === registrationId
            ? {
                ...registration,
                attendanceStatus: response.attendanceStatus ?? 'MANUAL_CHECKED_IN',
                checkedInAt: response.checkedInAt ?? new Date().toISOString(),
                checkedInBy: response.checkedInBy ?? 'admin',
              }
            : registration
        )
      );
    } catch (requestError) {
      setActionError('Check-in nije uspeo.');
    } finally {
      setCheckingInId(null);
    }
  };

  const applyCheckInResult = (
    registrationId: number | null | undefined,
    scannedToken: string,
    attendanceStatus: AttendanceStatus | null | undefined,
    checkedInAt: string | null | undefined,
    checkedInBy: string | null | undefined
  ) => {
    setRegistrations((currentRegistrations) =>
      currentRegistrations.map((registration) =>
        registration.id === registrationId || registration.qrToken === scannedToken
          ? {
              ...registration,
              attendanceStatus: attendanceStatus ?? 'CHECKED_IN',
              checkedInAt: checkedInAt ?? new Date().toISOString(),
              checkedInBy: checkedInBy ?? 'admin',
            }
          : registration
      )
    );
  };

  const performQrCheckIn = async (token: string) => {
    if (!id || !token.trim()) {
      return;
    }

    try {
      setCheckingInId(-1);
      setActionError(null);
      setActionSuccess(null);
      const scannedToken = token.trim();
      const response = await guestsApi.checkInByQrCode(id, scannedToken);
      const matchedRegistration = findRegistrationForCheckIn(response.registrationId, scannedToken);
      setQrCode('');
      setActionSuccess(
        matchedRegistration
          ? `${getGuestDisplayName(matchedRegistration)} | ${matchedRegistration.eventName}`
          : event?.name ?? 'Dogadjaj'
      );
      applyCheckInResult(
        response.registrationId,
        scannedToken,
        response.attendanceStatus,
        response.checkedInAt,
        response.checkedInBy
      );
    } catch (requestError) {
      setActionError('QR kod nije validan, gost je uklonjen sa dogadjaja ili je vec evidentiran.');
    } finally {
      setCheckingInId(null);
    }
  };

  const handleQrCheckIn = async () => {
    await performQrCheckIn(qrCode);
  };

  const handleQrKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleQrCheckIn();
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

  const handleStatusFilterChange = (event: SelectChangeEvent<AttendanceStatus | ''>) => {
    setStatusFilter(event.target.value as AttendanceStatus | '');
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !event) {
    return <ErrorAlert message={error ?? 'Dogadjaj nije pronadjen.'} />;
  }

  const metrics = getSummaryMetrics(registrations);
  const totalItems = filteredRegistrations.length;
  const totalActiveRegistrations = activeRegistrations.length;

  return (
    <>
      <Stack spacing={3}>
        <Box className="event-registrations-page__header">
          <Box>
            <Typography variant="overline" className="event-registrations-page__eyebrow">
              CHECK-IN I PREGLED
            </Typography>
            <Typography variant="h4" className="event-registrations-page__title">
              Prijavljeni gosti
            </Typography>
            <Typography color="text.secondary" className="event-registrations-page__subtitle">
              {event.name} | {event.location}
            </Typography>
          </Box>
          {isAdmin ? (
            <Box className="event-registrations-page__header-actions">
              <Button onClick={() => navigate(`/admin/guests?eventId=${event.id}`)}>
                Upravljaj gostima
              </Button>
            </Box>
          ) : null}
        </Box>

        <Box className="event-registrations-page__summary event-registrations-page__section-summary">
          <Box className="event-registrations-page__summary-card">
            <Typography variant="h5">{totalActiveRegistrations}</Typography>
            <Typography color="text.secondary">Ukupno prijavljenih</Typography>
          </Box>
          <Box className="event-registrations-page__summary-card">
            <Typography variant="h5">{metrics.notArrived}</Typography>
            <Typography color="text.secondary">Nisu dosli</Typography>
          </Box>
          <Box className="event-registrations-page__summary-card">
            <Typography variant="h5">{metrics.totalArrived}</Typography>
            <Typography color="text.secondary">Ukupno dosli</Typography>
          </Box>
          <Box className="event-registrations-page__summary-card">
            <Typography variant="h5">{metrics.qrArrivals}</Typography>
            <Typography color="text.secondary">Dosli preko QR-a</Typography>
          </Box>
          <Box className="event-registrations-page__summary-card">
            <Typography variant="h5">{metrics.manualArrivals}</Typography>
            <Typography color="text.secondary">Dosli rucno</Typography>
          </Box>
          <Box className="event-registrations-page__summary-card">
            <Typography variant="h5">{metrics.canceled}</Typography>
            <Typography color="text.secondary">Uklonjeni sa dogadjaja</Typography>
          </Box>
        </Box>

        <Box className="event-registrations-page__scanner event-registrations-page__section-scanner">
          <Typography variant="h6">QR check-in</Typography>
          <Typography color="text.secondary">
            Skeniraj ili unesi QR kod i status ce automatski preci na prisutan.
          </Typography>
          <Box className="event-registrations-page__scanner-camera-action">
            <Button
              variant="outlined"
              onClick={() => setIsScannerOpen(true)}
              disabled={checkingInId === -1}
            >
              Skeniraj kamerom
            </Button>
          </Box>
          <Stack spacing={2} className="event-registrations-page__scanner-form">
            <TextField
              label="QR kod"
              value={qrCode}
              onChange={(event) => setQrCode(event.target.value)}
              onKeyDown={handleQrKeyDown}
              fullWidth
            />
            <Button onClick={handleQrCheckIn} disabled={!qrCode.trim() || checkingInId === -1}>
              Check-in po QR
            </Button>
          </Stack>
        </Box>

        <Box className="event-registrations-page__filters event-registrations-page__section-filters event-registrations-page__surface">
          <TextField
            label="Pretraga prijavljenih"
            placeholder="Pretrazi po imenu ili emailu gosta"
            value={searchTerm}
            onChange={handleSearchTermChange}
            className="event-registrations-page__search"
          />
          <FormControl className="event-registrations-page__status-filter">
            <InputLabel id="registration-status-filter-label">Status dolaska</InputLabel>
            <Select
              labelId="registration-status-filter-label"
              label="Status dolaska"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              {ATTENDANCE_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {filteredRegistrations.length === 0 ? (
          <EmptyState
            title={debouncedSearchTerm || statusFilter ? 'Nema prijavljenih za zadati filter' : 'Nema prijavljenih gostiju'}
            description={
              debouncedSearchTerm || statusFilter
                ? 'Promenite filtere ili prijavite novog gosta iz baze gostiju.'
                : 'Dodajte goste u bazu i prijavite ih na ovaj dogadjaj.'
            }
          />
        ) : (
          <Box className="event-registrations-page__table-wrapper event-registrations-page__section-table event-registrations-page__surface">
            <TableContainer>
              <EventRegistrationsTable
                registrations={paginatedRegistrations}
                checkingInId={checkingInId}
                onCheckIn={handleCheckIn}
              />
            </TableContainer>
            <TablePagination
              component="div"
              count={totalItems}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Box>
        )}
      </Stack>
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
      <QrScannerDialog
        open={isScannerOpen}
        scanning={checkingInId === -1}
        onClose={() => setIsScannerOpen(false)}
        onDetected={performQrCheckIn}
      />
    </>
  );
}
