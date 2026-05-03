import {
  Chip,
  Checkbox,
  IconButton,
  Stack,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { EventRegistrationDto, GuestDto } from '../types/guest';
import './GuestsTable.css';

type GuestsTableProps = {
  guests: GuestDto[];
  deletingId: number | null;
  selectedGuestIds?: number[];
  registrationsByGuestId?: Record<number, EventRegistrationDto>;
  showEventActions?: boolean;
  onEdit: (guest: GuestDto) => void;
  onDelete: (id: number) => void;
  onToggleSelection?: (guestId: number) => void;
  onToggleSelectAll?: (guestIds: number[]) => void;
  onUnregister?: (registrationId: number) => void;
  onSendEmail?: (registrationId: number) => void;
  onDownloadQr?: (registrationId: number) => void;
  onDownloadPdf?: (registrationId: number) => void;
  emailSendingId?: number | null;
  unregisteringRegistrationId?: number | null;
};

function getRegistrationLabel(registration?: EventRegistrationDto) {
  return registration ? 'Prijavljen' : 'Nije prijavljen';
}

function getInvitationLabel(registration?: EventRegistrationDto) {
  if (!registration) {
    return '-';
  }

  if (registration.invitationStatus === 'PENDING') {
    return 'Nije poslata';
  }

  if (registration.invitationStatus === 'SENT') {
    return 'Poslata';
  }

  if (registration.invitationStatus === 'DELIVERED') {
    return 'Isporucena';
  }

  if (registration.invitationStatus === 'OPENED') {
    return 'Otvorena';
  }

  return 'Greska';
}

function getInvitationErrorText(registration?: EventRegistrationDto) {
  if (!registration?.invitationErrorMessage) {
    return '';
  }

  return registration.invitationErrorMessage;
}

function getInvitationChipColor(
  registration?: EventRegistrationDto
): 'default' | 'success' | 'warning' | 'error' {
  if (!registration) {
    return 'default';
  }

  if (registration.invitationStatus === 'FAILED') {
    return 'error';
  }

  if (
    registration.invitationStatus === 'SENT' ||
    registration.invitationStatus === 'DELIVERED' ||
    registration.invitationStatus === 'OPENED'
  ) {
    return 'success';
  }

  return 'warning';
}

function getRegistrationChipColor(
  registration?: EventRegistrationDto
): 'default' | 'success' {
  return registration ? 'success' : 'default';
}

function EmailActionIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M4 6h16c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2Zm0 2 8 5 8-5H4Zm16 8V9l-8 5-8-5v7h16Z" />
    </SvgIcon>
  );
}

function EditActionIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="m3 17.25 9.88-9.88 3.75 3.75L6.75 21H3v-3.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79Z" />
    </SvgIcon>
  );
}

function RemoveActionIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M19 13H5v-2h14v2Z" />
    </SvgIcon>
  );
}

function DeleteActionIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M6 7h12l-1 13H7L6 7Zm3-3h6l1 2h4v2H4V6h4l1-2Z" />
    </SvgIcon>
  );
}

function DownloadQrIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M4 4h6v6H4V4Zm2 2v2h2V6H6Zm8-2h6v6h-6V4Zm2 2v2h2V6h-2ZM4 14h6v6H4v-6Zm2 2v2h2v-2H6Zm11-2h3v3h-2v1h2v2h-3v-3h1v-1h-1v-2Zm-3 0h2v2h-2v-2Zm-2 2h2v4h-4v-2h2v-2Z" />
    </SvgIcon>
  );
}

function DownloadPdfIcon() {
  return (
    <SvgIcon fontSize="small">
      <path d="M6 2h8l4 4v14H6V2Zm7 1.5V7h3.5L13 3.5ZM8 12h2.2c1.4 0 2.3.8 2.3 2s-.9 2-2.3 2H9.5V18H8v-6Zm1.5 1.3v1.5h.6c.6 0 .9-.3.9-.8s-.3-.7-.9-.7h-.6Zm4.1-1.3H16c1.7 0 2.8 1.1 2.8 3s-1.1 3-2.8 3h-2.4v-6Zm1.5 1.3v3.4h.7c.9 0 1.5-.6 1.5-1.7s-.6-1.7-1.5-1.7h-.7Z" />
    </SvgIcon>
  );
}

export function GuestsTable({
  guests,
  deletingId,
  selectedGuestIds = [],
  registrationsByGuestId = {},
  showEventActions = false,
  onEdit,
  onDelete,
  onToggleSelection,
  onToggleSelectAll,
  onUnregister,
  onSendEmail,
  onDownloadQr,
  onDownloadPdf,
  emailSendingId,
  unregisteringRegistrationId,
}: GuestsTableProps) {
  const allSelected = guests.length > 0 && guests.every((guest) => selectedGuestIds.includes(guest.id));

  return (
    <Table>
      <TableHead>
        <TableRow>
          {showEventActions ? (
            <TableCell padding="checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={selectedGuestIds.length > 0 && !allSelected}
                onChange={() => onToggleSelectAll?.(guests.map((guest) => guest.id))}
              />
            </TableCell>
          ) : null}
          <TableCell>Gost</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Telefon</TableCell>
          <TableCell>Kompanija</TableCell>
          {showEventActions ? <TableCell>Status za dogadjaj</TableCell> : null}
          {showEventActions ? <TableCell>Email pozivnica</TableCell> : null}
          <TableCell align="right">Akcije</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {guests.map((guest) => {
          const registration = registrationsByGuestId[guest.id];

          return (
            <TableRow key={guest.id} hover className="guests-table__row">
              {showEventActions ? (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedGuestIds.includes(guest.id)}
                    onChange={() => onToggleSelection?.(guest.id)}
                  />
                </TableCell>
              ) : null}
              <TableCell>
                <Typography className="guests-table__name">
                  {guest.firstName} {guest.lastName}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography className="guests-table__primary-value">
                  {guest.email || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography className="guests-table__primary-value">
                  {guest.phone || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography className="guests-table__primary-value">
                  {guest.company || '-'}
                </Typography>
              </TableCell>
              {showEventActions ? (
                <TableCell>
                  <Chip
                    size="small"
                    label={getRegistrationLabel(registration)}
                    color={getRegistrationChipColor(registration)}
                    variant={registration ? 'filled' : 'outlined'}
                  />
                </TableCell>
              ) : null}
              {showEventActions ? (
                <TableCell>
                  <Chip
                    size="small"
                    label={getInvitationLabel(registration)}
                    color={getInvitationChipColor(registration)}
                    variant="outlined"
                  />
                  {registration?.invitationStatus === 'FAILED' && registration.invitationErrorMessage ? (
                    <Typography variant="body2" color="error" className="guests-table__error-text">
                      {getInvitationErrorText(registration)}
                    </Typography>
                  ) : null}
                </TableCell>
              ) : null}
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} className="guests-table__actions">
                  {showEventActions && registration ? (
                    <>
                      <Tooltip title="Preuzmi PNG QR">
                        <span>
                          <IconButton
                            className="guests-table__icon-button"
                            onClick={() => onDownloadQr?.(registration.id)}
                            color="primary"
                          >
                            <DownloadQrIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Preuzmi PDF ulaznicu">
                        <span>
                          <IconButton
                            className="guests-table__icon-button"
                            onClick={() => onDownloadPdf?.(registration.id)}
                            color="primary"
                          >
                            <DownloadPdfIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Posalji email">
                        <span>
                          <IconButton
                            className="guests-table__icon-button"
                            onClick={() => onSendEmail?.(registration.id)}
                            disabled={emailSendingId === registration.id}
                            color="primary"
                          >
                            <EmailActionIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Ukloni sa dogadjaja">
                        <span>
                          <IconButton
                            className="guests-table__icon-button guests-table__icon-button--danger"
                            onClick={() => onUnregister?.(registration.id)}
                            disabled={unregisteringRegistrationId === registration.id}
                            color="error"
                          >
                            <RemoveActionIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </>
                  ) : null}
                  <Tooltip title="Izmeni gosta">
                    <span>
                      <IconButton
                        className="guests-table__icon-button"
                        onClick={() => onEdit(guest)}
                        color="primary"
                      >
                        <EditActionIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {!showEventActions ? (
                    <Tooltip title="Obrisi iz baze">
                      <span>
                        <IconButton
                          className="guests-table__icon-button guests-table__icon-button--danger"
                          color="error"
                          disabled={deletingId === guest.id}
                          onClick={() => onDelete(guest.id)}
                        >
                          <DeleteActionIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
