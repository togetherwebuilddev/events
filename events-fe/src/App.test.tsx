import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders admin panel header', () => {
  render(<App />);
  const headerElement = screen.getByText(/admin panel/i);
  expect(headerElement).toBeInTheDocument();
});
