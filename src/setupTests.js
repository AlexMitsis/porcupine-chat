// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.REACT_APP_SUPABASE_URL = 'https://test-supabase-url.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';
