import { Box, CircularProgress } from '@mui/material';
import './LoadingState.css';

export function LoadingState() {
  return (
    <Box className="loading-state">
      <CircularProgress />
    </Box>
  );
}
