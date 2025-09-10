import { render } from '@testing-library/react';
import App from './App';

test('App component renders without crashing', () => {
  render(<App />);
  // Just testing that the app renders without errors
  // Since we have Supabase dependencies, this validates the setup
});
