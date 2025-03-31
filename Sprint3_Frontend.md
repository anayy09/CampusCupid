# Sprint 3 Documentation

## Group Members:
**Abhijeet Mallick (33790822), Rijul Bir Singh (97518637), Anay (68789243), Ethan (19334894)**

## Demonstration Videos  
- **Frontend**:
- **Backend**: 

---

## Work Completed in Sprint 3

### Frontend

#### Completed Tasks

## Location Handling

### Geolocation API Integration
- Uses the **browser's Geolocation API** (`navigator.geolocation.getCurrentPosition`) to obtain latitude and longitude.

### Reverse Geocoding
- Sends location coordinates to a **third-party API** (e.g., Google Maps, OpenStreetMap) to fetch city, state, and country.

### State Management & Storage
- Saves user location in **React state (`useState`)** and persists it in **localStorage** or a backend database.

### Permissions Handling
- Implements **permission checks** (`navigator.permissions.query`) to detect user denial and provide manual input fallback.

### Error Handling & Fallbacks
- Displays alerts/modals for denied location access, allowing users to manually enter their city/region.

---

## Dashboard Page (After Signup)

### State Management & API Integration
- Fetches **user profile data** from an authenticated API request.
- Stores user details in **React state (`useState`)** and updates dynamically.
- Implements **error handling** for authentication failures (e.g., expired tokens redirecting to login).

### Dynamic Profile Rendering & UI Components
- Displays **user information** (name, bio, age, gender, profile picture) dynamically.
- Uses **Material UI** (`Card`, `Typography`, `Avatar`, `Grid`) for structured UI.
- Includes **conditional rendering** for missing profile details.

### Navigation & Authentication Handling
- Uses **React Router (`useNavigate`)** for redirections (e.g., `/login` if unauthenticated).
- Logout functionality clears `localStorage` and redirects to login.
- Provides buttons for **"Edit Profile"**, **"Find Matches"**, and **"Settings"**.

### Snackbar Notifications & User Feedback
- Displays **notifications (`<Snackbar>` with `<Alert>`)** for errors (e.g., failed profile fetch).
- Uses **state-based visibility toggling** to show success/error messages dynamically.

---

## Matcher Page

### User Matching Algorithm
- Retrieves **other user profiles** from the backend via an API request.
- Implements **matching criteria** based on location, age, gender preference, and interests.
- Uses **a weighted scoring system** to rank potential matches.

### Interactive UI with Swipe/Selection
- Implements **swipe functionality** (`react-swipeable`) for a Tinder-like experience.
- Users can **like, dislike, or super-like** profiles, triggering state updates & API requests.
- Displays **profile cards with images, bio, and common interests** in a dynamic carousel.

### Real-time Matchmaking & WebSockets
- Uses **WebSockets (`Socket.IO`)** for real-time match updates on mutual likes.
- Implements a **match notification system** to alert users instantly.
- Future improvements: **Live chat feature** for matched users.

### Performance & Optimization
- Implements **lazy loading** (`React Suspense`) for profile images.
- Uses **pagination or infinite scrolling** (`react-infinite-scroll-component`) for efficiency.
- Optimizes API requests with **debouncing (`lodash.debounce`)** to prevent excessive calls.

---
## Unit Testing cases

### 1. Landing Page Tests
**File:** `cypress/e2e/landing-page.cy.js`

#### Implemented Test Cases:
- **Title and Subtitle Validation:** Ensures the correct title (`Campus Cupid`) and subtitle (`Join millions of people connecting through love`) are displayed.
- **Feature Cards Visibility:** Verifies that feature cards for `Smart Matching`, `Large Community`, and `Safe & Secure` are visible.
- **Navigation Tests:**
  - Clicking the `Login` button navigates to the `/login` page.
  - Clicking the `Sign Up Now` button navigates to the `/signup` page.
- **Call to Action Section:** Ensures `LOVE STARTS HERE` is visible.

### 2. Sign-Up Page Tests
**File:** `cypress/e2e/signup-page.cy.js`

#### Implemented Test Cases:
- **Stepper Validation:** Ensures all steps (`Basic Info`, `About You`, `Photos`) are present.
- **Age Validation:** Ensures users below 18 cannot proceed.
- **Password Match Validation:** Checks for a mismatch between password and confirm password fields.
- **Location Detection:** Mocks geolocation and OpenStreetMap API to verify that the detected location (City, Country) populates correctly.
- **Full Signup Flow:** Tests the entire signup process:
  1. **Basic Info:** Fills in user details, detects location, and proceeds to the next step.
  2. **About You:** Selects gender, preference, relationship type, and enters interests and bio.
  3. **Photo Upload:** Uploads images and completes registration.
  4. **Redirection:** Ensures successful signup redirects to the login page.
- **Minimum Photo Requirement:** Ensures users cannot proceed without uploading at least two photos.

### 3. Cypress Template Spec Test
**File:** `cypress/e2e/template-spec.cy.js`
- A basic test case to check Cypress setup by visiting an example page (`https://example.cypress.io`).

## Summary
These test cases help ensure that the core functionalities of the landing and signup pages work as expected, improving the overall reliability and stability of the application.



# In Progress

1. Integrate matcher functionality fully - it's partially working as of now.
2. Add more unit test cases.
