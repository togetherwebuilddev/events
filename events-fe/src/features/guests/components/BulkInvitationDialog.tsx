import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import './BulkInvitationDialog.css';

type BulkInvitationDialogProps = {
  open: boolean;
  selectedCount: number;
  title?: string;
  isSubmitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (subject: string, body: string) => Promise<void>;
};

export function BulkInvitationDialog({
  open,
  selectedCount,
  title = 'Slanje emaila',
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: BulkInvitationDialogProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!open) {
      setSubject('');
      setBody('');
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(subject.trim(), body.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent className="bulk-invitation-dialog__content">
          <Stack spacing={2}>
            <Typography color="text.secondary">
              Email ce biti poslat za {selectedCount} izabranih gostiju.
            </Typography>
            <Typography color="text.secondary">
              Opcija selektovanja trenutno vazi za goste prikazane na ovoj strani tabele.
            </Typography>
            <Alert severity="info">
              Ako ostavite naslov ili tekst praznim, server ce sam generisati poruku sa
              informacijama o dogadjaju i QR kodom.
            </Alert>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <TextField
              label="Naslov email poruke"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              fullWidth
            />
            <TextField
              label="Tekst poruke"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              multiline
              minRows={6}
              placeholder={
                'Mozete koristiti: {{guestFullName}}, {{eventName}}, {{eventLocation}}, {{eventStart}}, {{eventEnd}}, {{qrToken}}'
              }
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Otkazi
          </Button>
          <Button type="submit" disabled={isSubmitting || selectedCount === 0}>
            Posalji email
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
