# Sprint 4 Documentation

## Group Members:

Abhijeet Mallick (33790822), Rijul Bir Singh (97518637), Anay Sinhal (68789243), Ethan Klasky (19334894)

## Demonstration Videos

- **Frontend**: [[Link]](https://youtu.be/c-zNQAUXkj0)
- **Backend**: [[Link]](https://youtu.be/qAOF1oxO6Js)

Here’s the **“Detail Work Completed in Sprint 4”** section for your `Sprint4.md`, cleanly structured and split into **Frontend** and **Backend**, keeping tone, format, and flow consistent with your Sprint 3 doc:


### Work Completed in Sprint 4

#### ✅ Frontend

**Dashboard Enhancements**
- **Dynamic Photo Gallery**: Implemented an interactive image viewer using MUI’s `Dialog` and `ImageList`, enabling users to browse uploaded photos in a modal view. Real-time photo count display via `user.photos.length` improves feedback and helps debug photo-related issues.
- **City & Country Resolution**: Enhanced UI by conditionally showing location info (`LocationOn` icon and `user.location.city`). Built-in null checks prevent crashes if location access is denied or geocoding fails.
- **Improved UX on Errors & Loading**: Replaced generic loaders with centered `CircularProgress` indicators. Implemented state-controlled `Snackbar` + `Alert` for clearer feedback during API failures.

**Edit Profile Page Overhaul**
- **Multi-Image Upload Support**: Integrated secure file uploads to backend `/upload` endpoint using `FormData`. Photo URLs are appended to `formData.photos` and persist across sessions.
- **Interest Field Parsing & Deduplication**: Users can now type and press Enter to add interests. MUI `Chip` components display deduplicated, deletable tags inline.
- **Form Submission Updates**: Converted all inputs to controlled components. Profile updates are submitted via `PUT /profile/:id`, with improved error handling and feedback.

**Matcher Page Rebuild**
- **Swipe Gesture Detection**: Added manual swipe detection using `onTouchStart`, `onTouchMove`, and `onTouchEnd`. Cards animate off-screen using `transform` and `rotate()` styles based on swipe direction.
- **Profile Looping**: Built-in logic to traverse `profiles[]` statefully and reset UI after each action. Added fallback avatars on CDN failure via `imageLoadError`.
- **Mutual Match Alerts**: Integrated `Snackbar` alerts for mutual likes using backend response from `/like/:id`.
- **Keyboard Shortcuts**: Users can now swipe using arrow keys (← / →) for like/dislike, improving accessibility. Managed using `useEffect` and `keydown` listeners.

**Messaging + Matches View**
- **Tabbed Layout for Matches vs. Messages**: Separated “New Matches” and “Messages” using MUI `Tabs` and badge counts for better UX.
- **Optimistic Message Sending**: Messages are added to local UI state instantly before confirming backend write, with a `fetchMessages()` call ensuring data consistency.
- **Lazy Message Rendering**: Messages sorted using `created_at`, rendered with flex containers for sender/receiver, and auto-scrolled to bottom using `ref`.
- **Empty State Fallbacks**: Friendly CTAs like “Find Matches” or “Say Hello” now show when no messages exist.

**Settings Page Enhancements**
- **Slider-Controlled Preferences**: Age and distance preferences are now adjustable via `MUI Slider`, synced to state and persisted via `PUT /profile/:user_id`.
- **Preference Mapping**: Internally normalized gender preference strings (“showMe”) to match backend enums and avoid validation issues.
- **Privacy Controls**: Added toggle switches for notification and privacy settings. Controls are conditionally rendered only after user data loads to avoid null errors.

**Bug Fixes**
- **Photo Not Displaying on Dashboard After Signup**: Fixed by falling back to `user.photos[0]` when `profilePictureURL` is missing; added default avatar fallback.
- **Messages Not Updating in Real-Time**: Fixed by triggering `fetchMessages()` after `POST /messages`, and implementing optimistic UI for smoother UX.


#### ⚙️ Backend

**Matchmaking Logic Enhancements**
- **Pagination**: Added `page` and `limit` query params to `/matches/:user_id` for efficient result fetching.
- **Filtering**: Refined filtering to include age, gender, and interest preferences. Excluded interacted, blocked, and current users from results.
- **Relaxed Fallback Matching**: If strict filters return no results, the system falls back to a relaxed query (excluding only interacted/blocked users).
- **Mutual Match Query Support**: Introduced `matched=true` query param to fetch only mutual matches via the `Interaction` model.
- **Data Sanitization**: All match responses return sanitized user objects to protect private fields.

**Profile Setup Improvements**
- **Cloudinary Photo Upload Integration**: Implemented secure image uploads using Cloudinary from `/upload` endpoint.
- **Default Profile Picture Assignment**: On registration, if `photos[]` is present, the first image is assigned to `profilePictureURL`.
- **Location Support on Register**: Added fields to store user latitude and longitude during signup.

**New API Features**
- **Unmatch Endpoint**: Added `POST /unmatch/:user_id` allowing users to unmatch previous connections. Updates match status bidirectionally.
- **Activity Log Endpoint**: New `GET /activity-log` API returns mocked user actions like likes/matches (preliminary implementation).
- **Admin Reports Endpoint**: Added `GET /reports` restricted to admins, providing full report list for moderation. Protected by `isAdmin` flag.

**Error Handling & Debugging**
- **Logging Support**: Injected detailed debug logs using Go’s `log` package for all critical flows: match queries, message fetch, and type assertions.
- **Refactored Type Assertions**: Ensured all `context` values are validated before usage; returns appropriate error if assertion fails.
- **Improved Query Logging**: Logged DB errors, query failures, and excluded user ID logic during match queries.

### Frontend Unit and Cypress Tests

#### Landing Page Tests  
**File:** `cypress/e2e/landing-page.cy.js`  
**Test Cases:**
- **Title and Subtitle Check**: Verifies presence of “Campus Cupid” and its tagline.
- **Feature Cards Visibility**: Ensures Smart Matching, Large Community, and Safe & Secure cards are visible.
- **Navigation**:  
  - Clicking "Login" redirects to `/login`.  
  - Clicking "Sign Up Now" redirects to `/signup`.
- **Call to Action**: Validates visibility of “LOVE STARTS HERE”.

#### Sign-Up Page Tests  
**File:** `cypress/e2e/signup-page.cy.js`  
**Test Cases:**
- **Stepper Navigation**: Ensures steps — Basic Info, About You, Photos — appear correctly.
- **Age Validation**: Blocks users under 18.
- **Password Matching**: Validates password and confirm password fields.
- **Geolocation + Reverse Geocoding**:
  - Mocks `navigator.geolocation` and OpenStreetMap API.
  - Verifies location fields auto-populate.
- **Full Signup Flow**:
  - Enters all user data across steps.
  - Uploads at least two images.
  - Validates successful redirection to login page.
- **Minimum Photo Requirement**: Prevents users from proceeding without 2 photos.

#### Matcher Page Tests  
**File:** `cypress/e2e/matcher-page.cy.js`  
**Test Cases:**
- **Swipe Left/Right Functionality**:
  - Verifies profile updates on swiping.
  - Confirms correct API triggers for like/dislike.
- **Mutual Match Alerts**: Checks Snackbar visibility on mutual likes.
- **Keyboard Interaction**: Ensures ← and → keys trigger correct swipes (tested via simulated keypresses).

#### Dashboard Page Tests  
**File:** `cypress/e2e/dashboard-page.cy.js`  
**Test Cases:**
- **Photo Gallery Modal**: Verifies modal opens on clicking image.
- **Photo Count Rendering**: Confirms that profile correctly displays number of uploaded photos.
- **Fallback Logic**: Ensures avatar fallback appears if no `profilePictureURL` or `photos[0]`.

#### General Frontend Improvements  
**New Assertions:**
- **Snackbar Error/Success States**: Confirm error and success messages appear based on mock API failures.
- **Interest Chips (Edit Profile Page)**: Verify addition and deletion of interest tags using MUI Chips.
- **Tab Navigation (MatchesPage)**: Validate tab switching behavior between “New Matches” and “Messages”.

### Backend Unit Tests

#### Matchmaking APIs  
**Endpoints & Test Cases:**

- **`GET /matches/:user_id`**
  - Successful match retrieval with preferences (location, age, gender).
  - User not found.
  - Invalid user ID format.
  - No matches found returns empty list.
  - Relaxed fallback tested when strict filters return no results.
  - Pagination via `page` and `limit` tested.

- **`POST /like/:target_id`**
  - Successful like.
  - Match creation upon mutual like.
  - Target user not found.
  - Already interacted user.
  - Self-like attempt.

- **`POST /dislike/:target_id`**
  - Successful dislike.
  - Target user not found.
  - Already disliked.
  - Self-dislike attempt.

#### Reporting & Blocking APIs  
**Endpoints & Test Cases:**

- **`POST /report/:target_id`**
  - Valid report submission with reason.
  - Missing report reason.
  - Target user not found.
  - Self-report blocked.
  - Too short/long reason string validation.

- **`POST /block/:target_id`**
  - Successfully block a user.
  - Already blocked user.
  - Self-block attempt.
  - Invalid target.

- **`DELETE /block/:target_id`**
  - Unblock a user.
  - Unblocking someone not blocked.
  - Self-unblock attempt.

#### Messaging APIs  
**Endpoints & Test Cases:**

- **`POST /messages`**
  - Send message between matched users.
  - Receiver does not exist.
  - Not matched with receiver.
  - Empty message blocked.
  - Message length limit enforced.

- **`GET /messages/:user_id`**
  - Retrieve full message thread.
  - User not found.
  - Users not matched.
  - Pagination tested.
  - Messages returned in chronological order.

- **`GET /conversations`**
  - Returns all conversations.
  - Includes last message and unread count.
  - Includes partner's basic info.
  - Empty state (no conversations) returns empty list.

#### User Profile APIs  
**Endpoints & Test Cases:**

- **`POST /register`**
  - Valid registration with photos and location.
  - Duplicate email.
  - Missing required fields.
  - Invalid age (under 18).
  - Validates password strength and photo count.

- **`POST /login`**
  - Successful login.
  - Wrong password.
  - Email not found.
  - JWT token generation and expiration.

- **`GET /profile/:user_id`
  - Fetches user profile successfully.
  - User not found.
  - Auth required.
  - Completeness of fields validated.

- **`PUT /profile/:user_id`**
  - Successfully updates profile.
  - Invalid update fields.
  - Unauthorized profile modification.

- **`DELETE /profile/:user_id`**
  - Successful account deletion.
  - Unauthorized access.
  - User not found.
  - Related data cleanup (matches, messages).

#### New APIs
**Endpoints & Test Cases:**

- **`GET /activity-log`**
  - Returns mock activity entries.
  - User not authenticated (invalid token).
  
- **`GET /reports`**
  - Admin can fetch all reports.
  - Non-admin user gets 403 Forbidden.
  - DB failure returns 500.

- **`POST /unmatch/:user_id`**
  - Successfully unmatches user.
  - Invalid target ID.
  - Unauthenticated user (401).
  - Bidirectional match removal verified.


## Backend API Documentation

#### Overview  
The backend of **CampusCupid** is built using **Go** and the **Gin** framework. It supports a secure and scalable set of APIs for authentication, profile management, matchmaking, messaging, reporting/blocking, and administrative moderation features.


#### Authentication APIs

**1. Register**  
- **Endpoint**: `/register`  
- **Method**: `POST`  
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
  "photos": ["photo1.jpg", "photo2.jpg"],
  "latitude": 37.7749,
  "longitude": -122.4194
}
```
- **Response**:  
  `201 Created`: User registered successfully.  
  `400 Bad Request`: Validation failed or duplicate email.

**2. Login**  
- **Endpoint**: `/login`  
- **Method**: `POST`  
- **Description**: Authenticates a user and returns a JWT token.  
- **Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```
- **Response**:  
  `200 OK`: Returns JWT token and user ID.  
  `401 Unauthorized`: Invalid credentials.


#### User Profile APIs

**1. Get User Profile**  
- **Endpoint**: `/profile/{user_id}`  
- **Method**: `GET`  
- **Response**:  
  `200 OK`: User profile details.  
  `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

**2. Update User Profile**  
- **Endpoint**: `/profile/{user_id}`  
- **Method**: `PUT`  
- **Request Body**:
```json
{
  "firstName": "John",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "interestedIn": "Female",
  "lookingFor": "Relationship",
  "interests": ["Music", "Travel"],
  "photos": ["photo1.jpg", "photo2.jpg"],
  "showMe": "Female",
  "distancePreference": 50,
  "ageRange": [20, 30],
  "notificationEnabled": true,
  "privateMode": false
}
```
- **Response**:  
  `200 OK`, `400 Bad Request`, `403 Forbidden`.

**3. Delete User Profile**  
- **Endpoint**: `/profile/{user_id}`  
- **Method**: `DELETE`  
- **Response**:  
  `200 OK`, `403 Forbidden`.


#### Matchmaking APIs

**1. Get Matches**  
- **Endpoint**: `/matches/{user_id}`  
- **Method**: `GET`  
- **Query Params**:  
  - `page` (optional): for pagination  
  - `limit` (optional): default is 10, max is 50  
  - `matched=true`: returns only mutual matches  
- **Response**:  
  `200 OK`: Returns sanitized list of potential or mutual matches.

**2. Like User**  
- **Endpoint**: `/like/{target_id}`  
- **Method**: `POST`  
- **Response**:  
  `200 OK`: Returns `{ matched: true/false }`  
  `400 Bad Request`: Already interacted or invalid ID.

**3. Dislike User**  
- **Endpoint**: `/dislike/{target_id}`  
- **Method**: `POST`  
- **Response**:  
  `200 OK`: Dislike recorded.

**4. Unmatch User** (🆕)  
- **Endpoint**: `/unmatch/{user_id}`  
- **Method**: `POST`  
- **Description**: Removes an existing mutual match between users.  
- **Response**:  
  `200 OK`: Unmatched successfully.  
  `400 Bad Request`, `401 Unauthorized`.


#### Messaging APIs

**1. Send Message**  
- **Endpoint**: `/messages`  
- **Method**: `POST`  
- **Request Body**:
```json
{
  "receiverID": 2,
  "content": "Hey there!"
}
```
- **Response**:  
  `201 Created`, `401 Unauthorized`, `400 Bad Request`.

**2. Get Messages**  
- **Endpoint**: `/messages/{user_id}`  
- **Method**: `GET`  
- **Query Params**: `page`, `limit` (optional for pagination)  
- **Response**:  
  `200 OK`: Chronologically ordered message thread.

**3. Get Conversations**  
- **Endpoint**: `/conversations`  
- **Method**: `GET`  
- **Response**:  
  `200 OK`: List of recent conversations with unread count and last message.


#### Reporting & Blocking APIs

**1. Report User**  
- **Endpoint**: `/report/{target_id}`  
- **Method**: `POST`  
- **Request Body**:
```json
{
  "reason": "Inappropriate behavior"
}
```
- **Response**:  
  `201 Created`, `400 Bad Request`.

**2. Block User**  
- **Endpoint**: `/block/{target_id}`  
- **Method**: `POST`  
- **Response**:  
  `200 OK`

**3. Unblock User**  
- **Endpoint**: `/block/{target_id}`  
- **Method**: `DELETE`  
- **Response**:  
  `200 OK`


#### Activity Log API

**1. Get Activity Log**  
- **Endpoint**: `/activity-log`  
- **Method**: `GET`  
- **Description**: Returns a mocked list of recent user actions (e.g., likes, matches).  
- **Response**:
```json
{
  "userID": 1,
  "log": [
    {
      "event": "like",
      "message": "You liked user #42",
      "timestamp": "2025-04-21T12:30:00Z"
    }
  ]
}
```


#### Admin API

**1. Get All Reports**  
- **Endpoint**: `/reports`  
- **Method**: `GET`  
- **Access**: Admin-only  
- **Response**:
```json
[
  {
    "reporterID": 12,
    "targetID": 42,
    "reason": "Spamming inappropriate content",
    "createdAt": "2025-04-20T18:20:00Z"
  }
]
```
- **Errors**:  
  `403 Forbidden`: Non-admin access  
  `500 Internal Server Error`: DB failure
