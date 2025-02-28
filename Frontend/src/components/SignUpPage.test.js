// src/components/SignUpPage.test.js

// Mock the useNavigate hook before importing anything
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),  // Preserve other imports
  useNavigate: jest.fn(),  // Mock the useNavigate hook
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUpPage from './SignUpPage';
import '@testing-library/jest-dom';

describe('SignUpPage', () => {
  // Create a mock function for useNavigate
  const mockNavigate = jest.fn();

  beforeEach(() => {
    // Redefine useNavigate to return the mock function before each test
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    mockNavigate.mockClear();  // Clear the mock before each test
  });

  test('signup form validates user is at least 18 years old', () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );
    
    // Enter age less than 18 years ago
    const today = new Date();
    const underageDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    const formattedDate = underageDate.toISOString().split('T')[0];
    
    const dobInput = screen.getByLabelText('Date of Birth');
    fireEvent.change(dobInput, { target: { value: formattedDate } });
    
    // Click next to proceed to next step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // The error message should appear for underage users
    expect(screen.getByText('You must be at least 18 years old to sign up')).toBeInTheDocument();
    
    // Now try with a valid age
    const validDate = new Date(today.getFullYear() - 19, today.getMonth(), today.getDate());
    const formattedValidDate = validDate.toISOString().split('T')[0];
    
    fireEvent.change(dobInput, { target: { value: formattedValidDate } });
    fireEvent.click(nextButton);
    
    // Should advance to next step and not show error message
    expect(screen.queryByText('You must be at least 18 years old to sign up')).not.toBeInTheDocument();
  });

  test('photo upload in signup form', () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );
    
    // Fill out first step
    const dobInput = screen.getByLabelText('Date of Birth');
    const validDate = new Date();
    validDate.setFullYear(validDate.getFullYear() - 20);
    fireEvent.change(dobInput, { target: { value: validDate.toISOString().split('T')[0] } });
    
    // Advance to the photo upload step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton); // Move to step 2
    fireEvent.click(nextButton); // Move to step 3 (photo upload)
    
    // Create a mock file
    const file = new File(['(⌐□_□)'], 'profile.png', { type: 'image/png' });
    
    // Find file input and simulate upload
    const fileInput = screen.getByLabelText(/Click to upload photo/i, { exact: false });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Verify the upload count changes
    // This will pass once you implement the photo upload functionality
    expect(screen.getByText('1/9 photos uploaded')).toBeInTheDocument();
  });

  test('stepper shows correct steps', () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );
    
    // Check that all 3 steps are shown
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Photos')).toBeInTheDocument();
  });
});
