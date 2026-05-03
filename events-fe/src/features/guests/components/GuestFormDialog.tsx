import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { defaultGuestFormValues, GuestDto, GuestFormValues } from '../types/guest';
import './GuestFormDialog.css';

type GuestFormDialogProps = {
  open: boolean;
  guest?: GuestDto | null;
  isSubmitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (values: GuestFormValues) => Promise<void>;
};

export function GuestFormDialog({
  open,
  guest,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: GuestFormDialogProps) {
  const initialValues = useMemo<GuestFormValues>(
    () =>
      guest
        ? {
            firstName: guest.firstName ?? '',
            lastName: guest.lastName ?? '',
            email: guest.email ?? '',
            phone: guest.phone ?? '',
            company: guest.company ?? '',
            notes: guest.notes ?? '',
          }
        : defaultGuestFormValues,
    [guest]
  );

  const [values, setValues] = useState<GuestFormValues>(initialValues);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialValues);
    setValidationError(null);
  }, [initialValues, open]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim()) {
      setValidationError('Ime, prezime i email su obavezni.');
      return;
    }

    setValidationError(null);
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{guest ? 'Izmena gosta' : 'Novi gost'}</DialogTitle>
        <DialogContent className="guest-form-dialog__content">
          <Stack spacing={2}>
            {validationError ? <Alert severity="warning">{validationError}</Alert> : null}
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Ime"
                name="firstName"
                value={values.firstName}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="Prezime"
                name="lastName"
                value={values.lastName}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Stack>

            <TextField
              label="Email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleInputChange}
              required
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Telefon"
                name="phone"
                value={values.phone}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Kompanija"
                name="company"
                value={values.company}
                onChange={handleInputChange}
                fullWidth
              />
            </Stack>

            <TextField
              label="Napomene"
              name="notes"
              value={values.notes}
              onChange={handleInputChange}
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
            {guest ? 'Sacuvaj izmene' : 'Dodaj gosta'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
