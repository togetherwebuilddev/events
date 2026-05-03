import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import './AdminLayout.css';

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAdmin, logout, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isEventsRoute = location.pathname.startsWith('/admin/events');
  const isGuestsRoute = location.pathname.startsWith('/admin/guests');

  const navItems = [
    { label: 'Dogadjaji', path: '/admin/events', active: isEventsRoute },
    ...(isAdmin ? [{ label: 'Gosti', path: '/admin/guests', active: isGuestsRoute }] : []),
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Ako backend logout ne uspe, ipak lokalno prekidamo sesiju u UI toku.
    }
    navigate('/login', { replace: true });
    setDrawerOpen(false);
  };

  const navContent = (
    <Box className="admin-layout__nav" role="navigation" aria-label="Glavna navigacija">
      {navItems.map((item) => (
        <Button
          key={item.path}
          className={`admin-layout__nav-button${
            item.active ? ' admin-layout__nav-button--active' : ''
          }`}
          onClick={() => handleNavigate(item.path)}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );

  return (
    <Box className="admin-layout">
      <AppBar position="static" color="inherit" elevation={0} className="admin-layout__appbar">
        <Toolbar className="admin-layout__toolbar">
          {isMobile ? (
            <IconButton
              className="admin-layout__menu-button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Otvori navigaciju"
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Box className="admin-layout__brand">
            <Typography variant="overline" className="admin-layout__eyebrow">
              SOKOJ EVENTS
            </Typography>
            <Typography variant="h6" className="admin-layout__title">
              {isAdmin ? 'Admin panel' : 'Check-in panel'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.fullName ?? ''}
            </Typography>
          </Box>
          {!isMobile ? navContent : null}
          {!isMobile ? <Button onClick={handleLogout}>Odjava</Button> : null}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="admin-layout__drawer"
      >
        <Stack spacing={2} className="admin-layout__drawer-content">
          <Box className="admin-layout__brand">
            <Typography variant="overline" className="admin-layout__eyebrow">
              SOKOJ EVENTS
            </Typography>
            <Typography variant="h6" className="admin-layout__title">
              {isAdmin ? 'Admin panel' : 'Check-in panel'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.fullName ?? ''}
            </Typography>
          </Box>
          {navContent}
          <Button onClick={handleLogout}>Odjava</Button>
        </Stack>
      </Drawer>

      <Container maxWidth="lg" className="admin-layout__container">
        <Paper className="admin-layout__content" square={false}>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}
