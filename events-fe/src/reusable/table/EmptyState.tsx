import { Paper, Typography } from '@mui/material';
import './EmptyState.css';

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Paper variant="outlined" className="empty-state">
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Paper>
  );
}
