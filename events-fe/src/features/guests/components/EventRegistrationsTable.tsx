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
import { formatDateTime } from '../../../utils/date';
import { AttendanceStatus, EventRegistrationDto, InvitationStatus } from '../types/guest';
import './EventRegistrationsTable.css';

type EventRegistrationsTableProps = {
  registrations: EventRegistrationDto[];
  checkingInId: number | null;
  onCheckIn: (registrationId: number) => void;
};

function getInvitationStatusLabel(status: InvitationStatus): string {
  if (status === 'PENDING') {
    return 'Nije poslata';
  }

  if (status === 'SENT') {
    return 'Poslata';
  }

  if (status === 'DELIVERED') {
    return 'Isporucena';
  }

  if (status === 'OPENED') {
    return 'Otvorena';
  }

  return 'Greska';
}

function getInvitationStatusColor(
  status: InvitationStatus
): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  if (status === 'SENT' || status === 'DELIVERED' || status === 'OPENED') {
    return 'success';
  }

  if (status === 'FAILED') {
    return 'error';
  }

  return 'default';
}

function getAttendanceStatusLabel(status: AttendanceStatus, canceledAt?: string | null): string {
  if (canceledAt) {
    return 'Uklonjen sa dogadjaja';
  }

  if (status === 'NOT_ARRIVED') {
    return 'Nije dosao';
  }

  if (status === 'CHECKED_IN' || status === 'MANUAL_CHECKED_IN') {
    return 'Prisutan';
  }

  return 'Nije dosao';
}

function getAttendanceStatusColor(
  status: AttendanceStatus,
  canceledAt?: string | null
): 'default' | 'success' | 'warning' | 'error' {
  if (canceledAt) {
    return 'error';
  }

  if (status === 'CHECKED_IN' || status === 'MANUAL_CHECKED_IN') {
    return 'success';
  }

  if (status === 'NOT_ARRIVED') {
    return 'warning';
  }

  return 'default';
}

function getArrivalMethodLabel(status: AttendanceStatus, canceledAt?: string | null): string {
  if (canceledAt) {
    return 'Uklonjen';
  }

  if (status === 'CHECKED_IN') {
    return 'QR kod';
  }

  if (status === 'MANUAL_CHECKED_IN') {
    return 'Rucno';
  }

  return 'Nije dosao';
}

export function EventRegistrationsTable({
  registrations,
  checkingInId,
  onCheckIn,
}: EventRegistrationsTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <Stack spacing={2}>
        {registrations.map((registration) => (
          <Paper key={registration.id} variant="outlined" className="event-registrations-table__card">
            <Stack spacing={2}>
              <Box>
                <Typography className="event-registrations-table__name">
                  {registration.guestFirstName} {registration.guestLastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {registration.guestEmail || 'Bez email adrese'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} className="event-registrations-table__chip-row">
                <Chip
                  size="small"
                  label={getInvitationStatusLabel(registration.invitationStatus)}
                  color={getInvitationStatusColor(registration.invitationStatus)}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={getAttendanceStatusLabel(registration.attendanceStatus, registration.canceledAt)}
                  color={getAttendanceStatusColor(registration.attendanceStatus, registration.canceledAt)}
                  variant="outlined"
                />
              </Stack>
              <Stack spacing={1}>
                <Typography variant="body2">
                  Nacin evidencije: {getArrivalMethodLabel(registration.attendanceStatus, registration.canceledAt)}
                </Typography>
                <Typography variant="body2">QR token: {registration.qrToken || '-'}</Typography>
                <Typography variant="body2">
                  Pozivnica poslata:{' '}
                  {registration.invitationSentAt ? formatDateTime(registration.invitationSentAt) : '-'}
                </Typography>
                <Typography variant="body2">
                  Dolazak evidentiran:{' '}
                  {registration.checkedInAt ? formatDateTime(registration.checkedInAt) : '-'}
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  disabled={
                    checkingInId === registration.id ||
                    Boolean(registration.canceledAt) ||
                    registration.attendanceStatus === 'CHECKED_IN' ||
                    registration.attendanceStatus === 'MANUAL_CHECKED_IN'
                  }
                  onClick={() => onCheckIn(registration.id)}
                >
                  Rucni check-in
                </Button>
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
          <TableCell>Gost</TableCell>
          <TableCell>Pozivnica</TableCell>
          <TableCell>Status dolaska</TableCell>
          <TableCell>Nacin evidencije</TableCell>
          <TableCell>QR kod</TableCell>
          <TableCell>Email poslat</TableCell>
          <TableCell>Ulaz evidentiran</TableCell>
          <TableCell align="right">Akcije</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {registrations.map((registration) => (
          <TableRow key={registration.id} hover>
            <TableCell>
              <Typography className="event-registrations-table__name">
                {registration.guestFirstName} {registration.guestLastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {registration.guestEmail}
              </Typography>
            </TableCell>
            <TableCell>
              <Stack spacing={0.5}>
                <Chip
                  size="small"
                  label={getInvitationStatusLabel(registration.invitationStatus)}
                  color={getInvitationStatusColor(registration.invitationStatus)}
                  variant="outlined"
                />
                {registration.invitationStatus === 'FAILED' && registration.invitationErrorMessage ? (
                  <Typography variant="body2" color="error">
                    {registration.invitationErrorMessage}
                  </Typography>
                ) : null}
              </Stack>
            </TableCell>
            <TableCell>
              <Chip
                size="small"
                label={getAttendanceStatusLabel(registration.attendanceStatus, registration.canceledAt)}
                color={getAttendanceStatusColor(registration.attendanceStatus, registration.canceledAt)}
                variant="outlined"
              />
            </TableCell>
            <TableCell>{getArrivalMethodLabel(registration.attendanceStatus, registration.canceledAt)}</TableCell>
            <TableCell className="event-registrations-table__qr">{registration.qrToken || '-'}</TableCell>
            <TableCell>
              {registration.invitationSentAt ? formatDateTime(registration.invitationSentAt) : '-'}
            </TableCell>
            <TableCell>{registration.checkedInAt ? formatDateTime(registration.checkedInAt) : '-'}</TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={1} className="event-registrations-table__actions">
                <Button
                  disabled={
                    checkingInId === registration.id ||
                    Boolean(registration.canceledAt) ||
                    registration.attendanceStatus === 'CHECKED_IN' ||
                    registration.attendanceStatus === 'MANUAL_CHECKED_IN'
                  }
                  onClick={() => onCheckIn(registration.id)}
                >
                  Rucni check-in
                </Button>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
