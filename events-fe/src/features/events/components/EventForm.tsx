import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { toApiDateTime, toInputDateTime } from '../../../utils/date';
import {
  defaultEventFormValues,
  EVENT_STATUS_OPTIONS,
  EventDto,
  EventFormValues,
} from '../types/event';
import './EventForm.css';

type EventFormProps = {
  initialValues?: EventDto;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
  title: string;
  description: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
};

export function EventForm({
  initialValues,
  isSubmitting,
  submitError,
  submitLabel,
  title,
  description,
  onSubmit,
}: EventFormProps) {
  const initialFormState = useMemo<EventFormValues>(
    () =>
      initialValues
        ? {
            name: initialValues.name ?? '',
            slug: initialValues.slug ?? '',
            description: initialValues.description ?? '',
            location: initialValues.location ?? '',
            startTime: toInputDateTime(initialValues.startTime),
            endTime: toInputDateTime(initialValues.endTime),
            status: initialValues.status ?? 'DRAFT',
            capacity: String(initialValues.capacity ?? ''),
            notes: initialValues.notes ?? '',
          }
        : defaultEventFormValues,
    [initialValues]
  );

  const [values, setValues] = useState<EventFormValues>(initialFormState);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialFormState);
  }, [initialFormState]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = event.target;
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.name || !values.slug || !values.location || !values.startTime || !values.endTime) {
      setValidationError('Popunite obavezna polja pre cuvanja dogadjaja.');
      return;
    }

    if (Number(values.capacity) < 0) {
      setValidationError('Kapacitet ne moze biti negativan.');
      return;
    }

    if (new Date(values.endTime) < new Date(values.startTime)) {
      setValidationError('Vreme zavrsetka mora biti posle vremena pocetka.');
      return;
    }

    setValidationError(null);

    await onSubmit({
      ...values,
      startTime: toApiDateTime(values.startTime),
      endTime: toApiDateTime(values.endTime),
      capacity: values.capacity,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className="event-form">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
        </Box>

        {validationError ? <Alert severity="warning">{validationError}</Alert> : null}
        {submitError ? <Alert severity="error">{submitError}</Alert> : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Naziv"
            name="name"
            value={values.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            label="Slug"
            name="slug"
            value={values.slug}
            onChange={handleInputChange}
            required
          />
        </Stack>

        <TextField
          label="Opis"
          name="description"
          value={values.description}
          onChange={handleInputChange}
          multiline
          minRows={4}
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Lokacija"
            name="location"
            value={values.location}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth size="small">
            <InputLabel id="event-status-label">Status</InputLabel>
            <Select
              labelId="event-status-label"
              label="Status"
              name="status"
              value={values.status}
              onChange={handleInputChange}
            >
              {EVENT_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Pocetak"
            name="startTime"
            type="datetime-local"
            value={values.startTime}
            onChange={handleInputChange}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Kraj"
            name="endTime"
            type="datetime-local"
            value={values.endTime}
            onChange={handleInputChange}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        <TextField
          label="Kapacitet"
          name="capacity"
          type="number"
          value={values.capacity}
          onChange={handleInputChange}
        />

        <TextField
          label="Napomene"
          name="notes"
          value={values.notes}
          onChange={handleInputChange}
          multiline
          minRows={3}
        />

        <Box className="event-form__actions">
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
