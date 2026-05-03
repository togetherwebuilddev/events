import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AdminLayout } from '../../reusable/layout/AdminLayout';
import { EventCreatePage } from '../../features/events/pages/EventCreatePage';
import { EventEditPage } from '../../features/events/pages/EventEditPage';
import { EventsListPage } from '../../features/events/pages/EventsListPage';
import { EventRegistrationsPage } from '../../features/guests/pages/EventRegistrationsPage';
import { GuestsListPage } from '../../features/guests/pages/GuestsListPage';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { useAuth } from '../../features/auth/context/AuthContext';
import { LoadingState } from '../../reusable/feedback/LoadingState';

function RequireAuth() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function RequireAdmin() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/events" replace />;
  }

  return <Outlet />;
}

function PublicOnly() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/events" replace />;
  }

  return <Outlet />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/admin/events" replace />} />
          <Route path="/admin/events" element={<EventsListPage />} />
          <Route path="/admin/events/:id/registrations" element={<EventRegistrationsPage />} />

          <Route element={<RequireAdmin />}>
            <Route path="/admin/events/new" element={<EventCreatePage />} />
            <Route path="/admin/events/:id/edit" element={<EventEditPage />} />
            <Route path="/admin/guests" element={<GuestsListPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
