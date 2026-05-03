import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventForm } from '../components/EventForm';
import { eventsApi } from '../api/eventsApi';
import { CreateEventRequest, EventFormValues } from '../types/event';

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  const apiMessage =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: { data?: { message?: unknown } } }).response?.data &&
    typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
      'string'
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : null;

  if (apiMessage === 'event.slug.exists') {
    return 'Dogadjaj sa ovim slug-om vec postoji.';
  }

  if (apiMessage) {
    return apiMessage;
  }

  return fallbackMessage;
}

function mapFormValuesToRequest(values: EventFormValues): CreateEventRequest {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    startTime: values.startTime,
    endTime: values.endTime,
    status: values.status,
    capacity: Number(values.capacity || 0),
    notes: values.notes.trim(),
  };
}

export function EventCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: EventFormValues) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await eventsApi.createEvent(mapFormValuesToRequest(values));
      navigate('/admin/events');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Cuvanje dogadjaja nije uspelo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EventForm
      title="Kreiraj dogadjaj"
      description="Unesite osnovne informacije za novi event."
      submitLabel="Sacuvaj dogadjaj"
      isSubmitting={isSubmitting}
      submitError={submitError}
      onSubmit={handleSubmit}
    />
  );
}
