// cypress/support/component-utils.js
import React from 'react';
import { mount } from 'cypress/react18';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a theme instance
const theme = createTheme();

// Create a query client with default options
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  },
});

// Mount component with all providers
Cypress.Commands.add('mountWithProviders', (component, options = {}) => {
  const queryClient = createTestQueryClient();
  
  const wrapped = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
  
  return mount(wrapped, options);
});
