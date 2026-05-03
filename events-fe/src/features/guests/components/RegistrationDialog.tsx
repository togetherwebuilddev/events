import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { GuestDto } from '../types/guest';
import './RegistrationDialog.css';

type RegistrationDialogProps = {
  open: boolean;
  guests: GuestDto[];
  isSubmitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (guestId: number, notes: string) => Promise<void>;
};

export function RegistrationDialog({
  open,
  guests,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: RegistrationDialogProps) {
  const [selectedGuest, setSelectedGuest] = useState<GuestDto | null>(null);
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const options = useMemo(() => guests, [guests]);

  useEffect(() => {
    if (!open) {
      setSelectedGuest(null);
      setNotes('');
      setValidationError(null);
    }
  }, [open]);

  const handleGuestChange = (_event: SyntheticEvent, value: GuestDto | null) => {
    setSelectedGuest(value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedGuest) {
      setValidationError('Izaberite gosta za registraciju.');
      return;
    }

    setValidationError(null);
    await onSubmit(selectedGuest.id, notes);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Prijava gosta na dogadjaj</DialogTitle>
        <DialogContent className="registration-dialog__content">
          <Stack spacing={2}>
            <Typography color="text.secondary">
              Nakon prijave, gosta mozemo poslati kroz email/QR/check-in tok.
            </Typography>

            {validationError ? <Alert severity="warning">{validationError}</Alert> : null}
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Autocomplete
              options={options}
              value={selectedGuest}
              onChange={handleGuestChange}
              getOptionLabel={(option) =>
                `${option.firstName} ${option.lastName} (${option.email})`
              }
              renderInput={(params) => <TextField {...params} label="Gost" required />}
              fullWidth
            />

            <TextField
              label="Napomena registracije"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Otkazi
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Prijavi gosta
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
