import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { EventDto } from '../types/event';
import { formatDateTime } from '../../../utils/date';
import './EventsTable.css';

type EventsTableProps = {
  events: EventDto[];
  isAdmin: boolean;
  onEdit: (id: number) => void;
  onManageRegistrations: (id: number) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
};

export function EventsTable({
  events,
  isAdmin,
  onEdit,
  onManageRegistrations,
  onDelete,
  deletingId,
}: EventsTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Stack spacing={2}>
        {events.map((event) => (
          <Paper key={event.id} variant="outlined" className="events-table__card">
            <Stack spacing={2}>
              <Box>
                <Typography className="events-table__name">{event.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.location || '-'}
                </Typography>
              </Box>
              <Stack spacing={1}>
                <Typography variant="body2">Pocetak: {formatDateTime(event.startTime)}</Typography>
                <Typography variant="body2">Kraj: {formatDateTime(event.endTime)}</Typography>
                <Typography variant="body2">Pozvani gosti: {event.invitedGuestsCount ?? 0}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} className="events-table__chip-row">
                <Chip size="small" label={event.status} color="primary" variant="outlined" />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="outlined" onClick={() => onManageRegistrations(event.id)}>
                  {isAdmin ? 'Gosti' : 'Check-in'}
                </Button>
                {isAdmin ? (
                  <Button variant="outlined" onClick={() => onEdit(event.id)}>
                    Izmeni
                  </Button>
                ) : null}
                {isAdmin ? (
                  <Button
                    color="error"
                    onClick={() => onDelete(event.id)}
                    disabled={deletingId === event.id}
                  >
                    Obrisi
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Naziv</TableCell>
          <TableCell>Lokacija</TableCell>
          <TableCell>Pocetak</TableCell>
          <TableCell>Kraj</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Kapacitet</TableCell>
          <TableCell>Pozvani</TableCell>
          <TableCell align="right">Akcije</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {events.map((event) => (
            <TableRow key={event.id} hover>
            <TableCell>
              <Typography className="events-table__name">{event.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {event.slug}
              </Typography>
            </TableCell>
            <TableCell>{event.location || '-'}</TableCell>
            <TableCell>{formatDateTime(event.startTime)}</TableCell>
            <TableCell>{formatDateTime(event.endTime)}</TableCell>
            <TableCell>
              <Chip size="small" label={event.status} color="primary" variant="outlined" />
            </TableCell>
            <TableCell>{event.capacity ?? '-'}</TableCell>
            <TableCell>{event.invitedGuestsCount ?? 0}</TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={1} className="events-table__actions">
                <Button variant="outlined" onClick={() => onManageRegistrations(event.id)}>
                  {isAdmin ? 'Gosti' : 'Check-in'}
                </Button>
                {isAdmin ? (
                  <Button variant="outlined" onClick={() => onEdit(event.id)}>
                    Izmeni
                  </Button>
                ) : null}
                {isAdmin ? (
                  <Button
                    color="error"
                    onClick={() => onDelete(event.id)}
                    disabled={deletingId === event.id}
                  >
                    Obrisi
                  </Button>
                ) : null}
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
