import {
  Alert,
  Box,
  Button,
  Stack,
  TableContainer,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../api/eventsApi';
import { EventsTable } from '../components/EventsTable';
import { EventDto } from '../types/event';
import { guestsApi } from '../../guests/api/guestsApi';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useAuth } from '../../auth/context/AuthContext';
import { EmptyState } from '../../../reusable/table/EmptyState';
import { ErrorAlert } from '../../../reusable/feedback/ErrorAlert';
import { LoadingState } from '../../../reusable/feedback/LoadingState';
import { getApiErrorMessage } from '../../../api/utils/getApiErrorMessage';
import './EventsListPage.css';

const DEFAULT_PAGE = 0;
const DEFAULT_ROWS_PER_PAGE = 10;

export function EventsListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  useEffect(() => {
    setPage(DEFAULT_PAGE);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [response, registrations] = await Promise.all([
          eventsApi.getEvents(page, rowsPerPage, debouncedSearchTerm),
          guestsApi.getAllRegistrations(),
        ]);
        const countsByEventId = registrations.reduce<Record<number, number>>((acc, registration) => {
          if (!registration.canceledAt) {
            acc[registration.eventId] = (acc[registration.eventId] ?? 0) + 1;
          }
          return acc;
        }, {});
        setEvents(
          response.items.map((event) => ({
            ...event,
            invitedGuestsCount: countsByEventId[event.id] ?? 0,
          }))
        );
        setTotalItems(response.totalItems);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, 'Neuspesno ucitavanje dogadjaja.'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvents();
  }, [debouncedSearchTerm, page, rowsPerPage]);

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      setDeleteError(null);
      await eventsApi.deleteEvent(id);
      const nextTotalItems = Math.max(totalItems - 1, 0);
      const nextPage =
        nextTotalItems > 0 && page > 0 && page * rowsPerPage >= nextTotalItems ? page - 1 : page;

      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        const [response, registrations] = await Promise.all([
          eventsApi.getEvents(page, rowsPerPage, debouncedSearchTerm),
          guestsApi.getAllRegistrations(),
        ]);
        const countsByEventId = registrations.reduce<Record<number, number>>((acc, registration) => {
          if (!registration.canceledAt) {
            acc[registration.eventId] = (acc[registration.eventId] ?? 0) + 1;
          }
          return acc;
        }, {});
        setEvents(
          response.items.map((event) => ({
            ...event,
            invitedGuestsCount: countsByEventId[event.id] ?? 0,
          }))
        );
        setTotalItems(response.totalItems);
      }
    } catch (deleteRequestError) {
      setDeleteError('Brisanje dogadjaja nije uspelo.');
    } finally {
      setDeletingId(null);
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

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <Stack spacing={3}>
      <Box className="events-list-page__header">
        <Box>
          <Typography variant="overline" className="events-list-page__eyebrow">
            ORGANIZACIJA
          </Typography>
          <Typography variant="h4" className="events-list-page__title">
            Dogadjaji
          </Typography>
          <Typography color="text.secondary" className="events-list-page__subtitle">
            {isAdmin
              ? 'Izaberite dogadjaj i unutar njega upravljajte gostima, email pozivnicama i check-inom.'
              : 'Izaberite dogadjaj i evidentirajte dolazak gostiju skeniranjem ili rucnim check-inom.'}
          </Typography>
        </Box>
        {isAdmin ? <Button onClick={() => navigate('/admin/events/new')}>Novi dogadjaj</Button> : null}
      </Box>

      <Box className="events-list-page__filters events-list-page__surface">
        <TextField
          label="Pretraga eventa"
          placeholder="Pretrazi po nazivu, slugu ili lokaciji"
          value={searchTerm}
          onChange={handleSearchTermChange}
          className="events-list-page__search"
        />
      </Box>

      {error ? <ErrorAlert message={error} /> : null}
      {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}

      {!error && events.length === 0 ? (
        <EmptyState
          title={debouncedSearchTerm ? 'Nema rezultata za zadatu pretragu' : 'Nema dodatih dogadjaja'}
          description={
            debouncedSearchTerm
              ? 'Probajte drugaciji pojam pretrage ili ocistite filter.'
              : 'Kreirajte prvi event da biste zapoceli administraciju.'
          }
        />
      ) : null}

      {!error && events.length > 0 ? (
        <Box className="events-list-page__table-wrapper events-list-page__surface">
          <TableContainer>
            <EventsTable
              events={events}
              isAdmin={isAdmin}
              onManageRegistrations={(id) => navigate(`/admin/events/${id}/registrations`)}
              onEdit={(id) => navigate(`/admin/events/${id}/edit`)}
              onDelete={handleDelete}
              deletingId={deletingId}
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
      ) : null}
    </Stack>
  );
}
