import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../../../api/utils/getApiErrorMessage';
import './AuthPage.css';

type LoginFormState = {
  email: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState<LoginFormState>({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof LoginFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      await login(form);
      navigate('/admin/events', { replace: true });
    } catch (submitError) {
      setError(
        getApiErrorMessage(submitError, 'Prijava nije uspela.', {
          'auth.unauthorized': 'Neispravni kredencijali.',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box className="auth-page">
      <Paper className="auth-page__card">
        <Typography variant="overline" className="auth-page__eyebrow">
          SOKOJ EVENTS
        </Typography>
        <Typography variant="h4" className="auth-page__title">
          Prijava
        </Typography>
        <Typography color="text.secondary" className="auth-page__subtitle">
          Ulogujte se da biste pristupili administraciji i check-in ekranu.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} className="auth-page__form">
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              required
              fullWidth
            />
            <TextField
              label="Lozinka"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              required
              fullWidth
            />
            <Button type="submit" disabled={isSubmitting}>
              Prijavi se
            </Button>
          </Stack>
        </Box>

        <Typography color="text.secondary" className="auth-page__footer">
          Nemate nalog? <Button component={RouterLink} to="/register">Registrujte se</Button>
        </Typography>
      </Paper>
    </Box>
  );
}
