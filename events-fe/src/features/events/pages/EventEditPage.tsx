import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EventForm } from '../components/EventForm';
import { eventsApi } from '../api/eventsApi';
import { EventDto, EventFormValues, UpdateEventRequest } from '../types/event';
import { ErrorAlert } from '../../../reusable/feedback/ErrorAlert';
import { LoadingState } from '../../../reusable/feedback/LoadingState';

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

function mapFormValuesToRequest(values: EventFormValues): UpdateEventRequest {
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

export function EventEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        setLoadError('Dogadjaj nije pronadjen.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await eventsApi.getEvent(id);
        setEvent(response);
      } catch (error) {
        setLoadError('Neuspesno ucitavanje dogadjaja.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvent();
  }, [id]);

  const handleSubmit = async (values: EventFormValues) => {
    if (!id) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await eventsApi.updateEvent(id, mapFormValuesToRequest(values));
      navigate('/admin/events');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Izmena dogadjaja nije uspela.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (loadError || !event) {
    return <ErrorAlert message={loadError ?? 'Dogadjaj nije pronadjen.'} />;
  }

  return (
    <EventForm
      title="Izmeni dogadjaj"
      description="Azurirajte podatke eventa i sacuvajte izmene."
      submitLabel="Sacuvaj izmene"
      initialValues={event}
      isSubmitting={isSubmitting}
      submitError={submitError}
      onSubmit={handleSubmit}
    />
  );
}
