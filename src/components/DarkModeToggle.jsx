import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const DarkModeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-6 w-11 items-center justify-center rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none dark:bg-dark-700"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
    >
      {/* Toggle background */}
      <span
        className={`absolute inset-0 rounded-full transition-colors duration-200 ${
          isDark 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
            : 'bg-gradient-to-r from-amber-400 to-orange-400'
        }`}
      />
      
      {/* Toggle knob */}
      <span
        className={`relative inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
          isDark ? 'translate-x-2' : '-translate-x-2'
        }`}
      >
        {/* Icon inside knob */}
        <span className="absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-100">
          {isDark ? (
            <svg
              className="h-3 w-3 text-purple-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : (
            <svg
              className="h-3 w-3 text-amber-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </span>
    </button>
  );
};

export default DarkModeToggle;