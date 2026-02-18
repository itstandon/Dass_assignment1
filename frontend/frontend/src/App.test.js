import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  // const linkElement = screen.getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
  const loginHeader = screen.getByText(/Login/i); // Matches the "Login" text on your button or header
  expect(loginHeader).toBeInTheDocument();
});
