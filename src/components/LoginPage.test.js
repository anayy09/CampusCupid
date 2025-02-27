// src/components/LoginPage.test.js

// Mock the useNavigate hook before importing anything
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),  // Preserve other imports
  useNavigate: () => mockNavigate,  // Mock the useNavigate hook with mockNavigate
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import '@testing-library/jest-dom';

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();  // Clear the mock before each test
  });

  test('login form validates required fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    
    // Try to submit without filling the form
    const loginButton = screen.getByText('Sign In');
    fireEvent.click(loginButton);
    
    // The error messages for empty fields should appear
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Email'), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Password'), { 
      target: { value: 'password123' } 
    });
    
    // Click the button again
    fireEvent.click(loginButton);
    
    // Error messages should be gone
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
    
    // Should navigate to home page after successful login
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('forgot password link exists', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    
    const forgotPasswordLink = screen.getByText('Forgot password?');
    expect(forgotPasswordLink).toBeInTheDocument();
  });
});
