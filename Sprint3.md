# Sprint 3 Documentation

## Group Members:
Abhijeet Mallick (33790822), Rijul Bir Singh (97518637), Anay (68789243), Ethan (19334894)

## Demonstration Videos
- **Frontend**: [Link to frontend demo]
- **Backend**: [Link to backend demo]

## Work Completed in Sprint 3

### Frontend
#### Completed Tasks

##### Location Handling
- **Geolocation API Integration**
  - Uses the browser's Geolocation API (`navigator.geolocation.getCurrentPosition`) to obtain latitude and longitude.
- **Reverse Geocoding**
  - Sends location coordinates to a third-party API (e.g., Google Maps, OpenStreetMap) to fetch city, state, and country.
- **State Management & Storage**
  - Saves user location in React state (`useState`) and persists it in localStorage or a backend database.
- **Permissions Handling**
  - Implements permission checks (`navigator.permissions.query`) to detect user denial and provide manual input fallback.
- **Error Handling & Fallbacks**
  - Displays alerts/modals for denied location access, allowing users to manually enter their city/region.

##### Dashboard Page (After Signup)
- **State Management & API Integration**
  - Fetches user profile data from an authenticated API request.
  - Stores user details in React state (`useState`) and updates dynamically.
  - Implements error handling for authentication failures (e.g., expired tokens redirecting to login).
- **Dynamic Profile Rendering & UI Components**
  - Displays user information (name, bio, age, gender, profile picture) dynamically.
  - Uses Material UI (`Card`, `Typography`, `Avatar`, `Grid`) for structured UI.
  - Includes conditional rendering for missing profile details.
- **Navigation & Authentication Handling**
  - Uses React Router (`useNavigate`) for redirections (e.g., `/login` if unauthenticated).
  - Logout functionality clears localStorage and redirects to login.
  - Provides buttons for "Edit Profile", "Find Matches", and "Settings".
- **Snackbar Notifications & User Feedback**
  - Displays notifications (`<Snackbar>` with `<Alert>`) for errors (e.g., failed profile fetch).
  - Uses state-based visibility toggling to show success/error messages dynamically.

##### Matcher Page
- **User Matching Algorithm**
  - Retrieves other user profiles from the backend via an API request.
  - Implements matching criteria based on location, age, gender preference, and interests.
  - Uses a weighted scoring system to rank potential matches.
- **Interactive UI with Swipe/Selection**
  - Implements swipe functionality (`react-swipeable`) for a Tinder-like experience.
  - Users can like, dislike, or super-like profiles, triggering state updates & API requests.
  - Displays profile cards with images, bio, and common interests in a dynamic carousel.
- **Real-time Matchmaking & WebSockets**
  - Uses WebSockets (Socket.IO) for real-time match updates on mutual likes.
  - Implements a match notification system to alert users instantly.
  - Future improvements: Live chat feature for matched users.
- **Performance & Optimization**
  - Implements lazy loading (React Suspense) for profile images.
  - Uses pagination or infinite scrolling (`react-infinite-scroll-component`) for efficiency.
  - Optimizes API requests with debouncing (`lodash.debounce`) to prevent excessive calls.

### Backend
#### Completed Tasks

##### Matchmaking Functionality
- **Matchmaking APIs**
  - Get Matches: Retrieves potential matches for a user based on preferences like location, age range, gender, and interests.
  - Like User: Allows a user to like another user. If both users like each other, a match is created.
  - Dislike User: Records a dislike interaction, ensuring the user is not shown again.
- **Reporting and Blocking**
  - Report User: Enables users to report inappropriate behavior with a reason.
  - Block User: Blocks a user, preventing further interaction or visibility.
  - Unblock User: Removes a user from the blocked list.
- **Real-time Match Updates**
  - Implements logic to notify users of mutual matches instantly.

##### Messaging Functionality
- **Messaging APIs**
  - Send Message: Allows users to send messages to matched users.
  - Get Messages: Retrieves the conversation between two matched users.
  - Get Conversations: Lists all conversations for the authenticated user, including the last message and unread count.
- **Features**
  - Message Read Status: Tracks whether a message has been read.
  - Pagination: Supports paginated retrieval of messages for efficient loading.

## Frontend Unit Tests

1. **Landing Page Tests**
   - File: `cypress/e2e/landing-page.cy.js`
   - Implemented Test Cases:
     - Title and Subtitle Validation: Ensures the correct title (Campus Cupid) and subtitle (Join millions of people connecting through love) are displayed.
     - Feature Cards Visibility: Verifies that feature cards for Smart Matching, Large Community, and Safe & Secure are visible.
     - Navigation Tests:
       - Clicking the Login button navigates to the `/login` page.
       - Clicking the Sign Up Now button navigates to the `/signup` page.
     - Call to Action Section: Ensures "LOVE STARTS HERE" is visible.

2. **Sign-Up Page Tests**
   - File: `cypress/e2e/signup-page.cy.js`
   - Implemented Test Cases:
     - Stepper Validation: Ensures all steps (Basic Info, About You, Photos) are present.
     - Age Validation: Ensures users below 18 cannot proceed.
     - Password Match Validation: Checks for a mismatch between password and confirm password fields.
     - Location Detection: Mocks geolocation and OpenStreetMap API to verify that the detected location (City, Country) populates correctly.
     - Full Signup Flow: Tests the entire signup process:
       - Basic Info: Fills in user details, detects location, and proceeds to the next step.
       - About You: Selects gender, preference, relationship type, and enters interests and bio.
       - Photo Upload: Uploads images and completes registration.
     - Redirection: Ensures successful signup redirects to the login page.
     - Minimum Photo Requirement: Ensures users cannot proceed without uploading at least two photos.

## Backend Unit Tests

### Matchmaking APIs Tests

1. **Get Matches** (`/matches/:user_id`)
   - **Successful Matches Retrieval**: Verifies that potential matches are correctly returned based on user preferences including age range, gender, and location.
   - **User Not Found**: Confirms appropriate error response when requesting matches for a non-existent user.
   - **Invalid User ID**: Tests error handling when an invalid user ID format is provided.
   - **Empty Results**: Validates behavior when no potential matches exist based on user preferences.

2. **Like User** (`/like/:target_id`)
   - **Successful Like**: Ensures a user can successfully like another user and the interaction is recorded.
   - **Match Creation**: Verifies that when two users like each other, a match is correctly created.
   - **Target User Not Found**: Tests error handling when attempting to like a non-existent user.
   - **Already Interacted**: Confirms appropriate error when a user attempts to like someone they've already interacted with.
   - **Self-Like Prevention**: Validates that users cannot like themselves.

3. **Dislike User** (`/dislike/:target_id`)
   - **Successful Dislike**: Ensures a user can successfully dislike another user.
   - **Target User Not Found**: Tests error handling when attempting to dislike a non-existent user.
   - **Already Interacted**: Confirms appropriate error when a user attempts to dislike someone they've already interacted with.
   - **Self-Dislike Prevention**: Validates that users cannot dislike themselves.

4. **Report User** (`/report/:target_id`)
   - **Successful Report**: Verifies that a user can successfully report another user with a valid reason.
   - **Missing Reason**: Tests validation that requires a reason when reporting a user.
   - **Target User Not Found**: Confirms error handling when reporting a non-existent user.
   - **Self-Report Prevention**: Validates that users cannot report themselves.
   - **Report Length Validation**: Tests minimum and maximum length requirements for report reasons.

5. **Block/Unblock User** (`/block/:target_id`)
   - **Successful Block**: Ensures a user can successfully block another user.
   - **Successful Unblock**: Verifies that a user can unblock a previously blocked user.
   - **Target User Not Found**: Tests error handling when blocking/unblocking a non-existent user.
   - **Self-Block Prevention**: Validates that users cannot block themselves.
   - **User Not Blocked**: Confirms appropriate error when attempting to unblock a user who isn't blocked.
   - **Already Blocked**: Tests error handling when attempting to block an already blocked user.

### Messaging APIs Tests

1. **Send Message** (`/messages`)
   - **Successful Message Send**: Verifies that a user can successfully send a message to a matched user.
   - **Receiver Not Found**: Tests error handling when sending a message to a non-existent user.
   - **Not Matched**: Confirms that users can only send messages to users they've matched with.
   - **Empty Message**: Validates that empty messages are rejected.
   - **Message Length**: Tests maximum message length constraints.

2. **Get Messages** (`/messages/:user_id`)
   - **Successful Messages Retrieval**: Ensures that conversation history between two matched users is correctly returned.
   - **User Not Found**: Tests error handling when requesting messages with a non-existent user.
   - **Not Matched**: Confirms that users can only view messages with users they've matched with.
   - **Pagination**: Verifies that messages are correctly paginated when the conversation is long.
   - **Message Ordering**: Tests that messages are returned in the correct chronological order.

3. **Get Conversations** (`/conversations`)
   - **Successful Conversations Retrieval**: Verifies that all conversations for a user are correctly returned.
   - **No Conversations**: Tests the response when a user has no conversations.
   - **Unread Count**: Validates that the unread message count is correctly calculated.
   - **Last Message**: Ensures that the most recent message in each conversation is correctly included.
   - **User Details**: Confirms that basic details about the conversation partner are included in the response.

### User Profile APIs Tests

1. **Register** (`/register`)
   - **Successful Registration**: Verifies that a new user can be successfully registered with valid information.
   - **Duplicate Email**: Tests error handling when attempting to register with an email that's already in use.
   - **Invalid Request (Missing Required Fields)**: Confirms validation errors when required fields are missing.
   - **Password Strength**: Tests password strength requirements (minimum length, complexity).
   - **Age Validation**: Verifies that users must be at least 18 years old to register.
   - **Photo Requirements**: Tests minimum and maximum photo upload requirements.

2. **Login** (`/login`)
   - **Successful Login**: Ensures a user can successfully log in with valid credentials.
   - **Invalid Credentials (Wrong Password)**: Tests error handling when an incorrect password is provided.
   - **Invalid Credentials (Non-Existent Email)**: Confirms appropriate error when attempting to log in with an email that doesn't exist.
   - **Token Generation**: Verifies that a valid JWT token is generated upon successful login.
   - **Token Expiration**: Tests that the generated token has the correct expiration time.

3. **Get Profile** (`/profile/:user_id`)
   - **Successful Profile Retrieval**: Ensures that a user's profile details are correctly returned.
   - **User Not Found**: Tests error handling when requesting a non-existent user's profile.
   - **Authentication Required**: Confirms that authentication is required to access profile information.
   - **Field Completeness**: Verifies that all expected profile fields are included in the response.

4. **Update Profile** (`/profile/:user_id`)
   - **Successful Profile Update**: Ensures that a user can successfully update their profile information.
   - **User Not Found**: Tests error handling when updating a non-existent user's profile.
   - **Field Validation**: Confirms validation for various profile fields (e.g., valid date formats, allowed gender values).
   - **Unauthorized Update**: Verifies that users cannot update profiles other than their own.

5. **Delete Profile** (`/profile/:user_id`)
   - **Successful Profile Deletion**: Ensures that a user can successfully delete their account.
   - **User Not Found**: Tests error handling when deleting a non-existent user's profile.
   - **Unauthorized Deletion**: Verifies that users cannot delete profiles other than their own.
   - **Data Cleanup**: Confirms that all related data (matches, messages, etc.) is properly cleaned up when a profile is deleted.

## In Progress

### Frontend
- Integrate matcher functionality fully - it's partially working as of now.
- Add more unit test cases

### Backend
- Complete WebSocket implementation for real-time messaging and notifications.
- Add rate limiting to prevent API abuse and enhance security.
- Develop admin dashboard API endpoints for moderation and analytics.

## Backend API Documentation

### Overview
The backend of CampusCupid is built using the Go programming language and the Gin framework. It provides a robust API for user authentication, profile management, matchmaking, messaging, and reporting/blocking functionalities.

### Authentication APIs

#### 1. Register
- **Endpoint**: `/register`
- **Method**: POST
- **Description**: Registers a new user with the provided details.
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "email": "john.doe@example.com",
    "password": "password123",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "interestedIn": "Female",
    "lookingFor": "Relationship",
    "interests": ["Music", "Travel"],
    "sexualOrientation": "Straight",
    "photos": ["photo1.jpg", "photo2.jpg"]
  }
  ```
- **Response**:
  - 201 Created: User registered successfully.
  - 400 Bad Request: Validation errors or duplicate email.

#### 2. Login
- **Endpoint**: `/login`
- **Method**: POST
- **Description**: Authenticates a user and returns a JWT token.
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  - 200 OK: Returns a JWT token and user ID.
  - 401 Unauthorized: Invalid credentials.

### User Profile APIs

#### 1. Get User Profile
- **Endpoint**: `/profile/{user_id}`
- **Method**: GET
- **Description**: Retrieves the profile details of a user.
- **Response**:
  - 200 OK: Returns user profile details.
  - 401 Unauthorized: Authentication required.
  - 403 Forbidden: Access denied.
  - 404 Not Found: User not found.

#### 2. Update User Profile
- **Endpoint**: `/profile/{user_id}`
- **Method**: PUT
- **Description**: Updates the profile details of a user.
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "interestedIn": "Female",
    "lookingFor": "Relationship",
    "interests": ["Music", "Travel"],
    "photos": ["photo1.jpg", "photo2.jpg"]
  }
  ```
- **Response**:
  - 200 OK: Profile updated successfully.
  - 400 Bad Request: Validation errors.
  - 403 Forbidden: Access denied.

#### 3. Delete User Profile
- **Endpoint**: `/profile/{user_id}`
- **Method**: DELETE
- **Description**: Deletes the authenticated user's account.
- **Response**:
  - 200 OK: Profile deleted successfully.
  - 403 Forbidden: Access denied.

### Matchmaking APIs

#### 1. Get Matches
- **Endpoint**: `/matches/{user_id}`
- **Method**: GET
- **Description**: Retrieves potential matches for a user based on preferences.
- **Response**:
  - 200 OK: Returns a list of potential matches.
  - 403 Forbidden: Access denied.

#### 2. Like User
- **Endpoint**: `/like/{target_id}`
- **Method**: POST
- **Description**: Records a like interaction and checks for a mutual match.
- **Response**:
  - 200 OK: Returns whether a match was created.
  - 400 Bad Request: Interaction already exists.

#### 3. Dislike User
- **Endpoint**: `/dislike/{target_id}`
- **Method**: POST
- **Description**: Records a dislike interaction.
- **Response**:
  - 200 OK: Dislike recorded successfully.

#### 4. Report User
- **Endpoint**: `/report/{target_id}`
- **Method**: POST
- **Description**: Submits a report against a user for inappropriate behavior.
- **Request Body**:
  ```json
  {
    "reason": "Inappropriate behavior"
  }
  ```
- **Response**:
  - 201 Created: Report submitted successfully.

#### 5. Block User
- **Endpoint**: `/block/{target_id}`
- **Method**: POST
- **Description**: Blocks a user, preventing further interaction.
- **Response**:
  - 200 OK: User blocked successfully.

#### 6. Unblock User
- **Endpoint**: `/block/{target_id}`
- **Method**: DELETE
- **Description**: Unblocks a user, allowing interaction again.
- **Response**:
  - 200 OK: User unblocked successfully.

### Messaging APIs

#### 1. Send Message
- **Endpoint**: `/messages`
- **Method**: POST
- **Description**: Sends a message to a matched user.
- **Request Body**:
  ```json
  {
    "receiverID": 2,
    "content": "Hello!"
  }
  ```
- **Response**:
  - 201 Created: Message sent successfully.

#### 2. Get Messages
- **Endpoint**: `/messages/{user_id}`
- **Method**: GET
- **Description**: Retrieves the conversation between the current user and another user.
- **Response**:
  - 200 OK: Returns a list of messages.

#### 3. Get Conversations
- **Endpoint**: `/conversations`
- **Method**: GET
- **Description**: Retrieves a list of all conversations for the current user.
- **Response**:
  - 200 OK: Returns a list of conversations with last message and unread count.