import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './LandingPage';
import '@testing-library/jest-dom';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('clicking login button navigates to login page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );
    
    // Find the login button and click it
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    // Check if navigate was called with the correct path
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('clicking sign up button navigates to signup page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );
    
    // Find the sign up button and click it
    const signUpButton = screen.getByText('Sign Up Now');
    fireEvent.click(signUpButton);
    
    // Check if navigate was called with the correct path
    expect(mockNavigate).toHaveBeenCalledWith('signup');
  });
});
