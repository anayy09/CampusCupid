# Sprint 2 Documentation

# Group Members:
# Abhijeet Mallick (33790822), Rijul Bir Singh (97518637), Anay (68789243), Ethan (19334894)

## Work Completed in Sprint 2

### Frontend

#### Completed Tasks

* Integrated frontend and backend using the Axios library in React.
* Successfully fetched data from the frontend and stored it in a PostgreSQL database hosted on Render via API keys.
* Implemented exception handling for various scenarios including:
  * Bad requests
  * Login failures
  * Signup issues
* Improved UI design with the following enhancements:
  * Autofill suggestion feature for interests in the signup field, enhancing user experience.
* Implemented Cypress test cases for frontend functionality:
  * Tested login and signup button functionality.
  * Verified age restriction compliance during signup.
  * Tested photo upload functionality for error handling and user experience.

#### In Progress

* Further integration of frontend with backend.
* Additional unit tests to improve test coverage and reliability.
* Developing new pages:
  * Profile page (invoked when a user is created).
  * Matchmaking page displaying active user profiles.
* UI/UX design improvements.

### Backend

* Improved login and registration APIs with enhanced error handling.

* Integrated and used these improved APIs in the frontend.
* Hosted the backend API on Render.
* Swagger documentation hosted at: [Swagger Documentation](https://campuscupid-backend.onrender.com/swagger/index.html)
* Used the testing package and httptest to simulate HTTP requests and responses, mock the database using SQLite for testing.
* Added three new APIs:

  * **Get User Profile (**`<span><strong>GET /profile/:user_id</strong></span>`**)**: Fetches the profile details of a user based on the provided `<span>user_id</span>`. Requires authentication via JWT.
  * **Update User Profile (**`<span><strong>PUT /profile/:user_id</strong></span>`**)**: Updates the user profile details such as interests, profile picture, and other non-authentication fields.
  * **Update User Preferences (**`<span><strong>PUT /preferences/:user_id</strong></span>`**)**: Allows users to update their preferences, including age range, distance, and gender preference.

## List of Unit Tests and Cypress Tests for Frontend

We use **Cypress** for unit testing the frontend of the application. The following behaviors are tested:

* **Button Functionality** : Ensuring that buttons (such as the login and signup buttons) work as expected when clicked.
* **Age Verification** : Ensuring that users confirm they are at least 18 years old during signup or login.

These tests help enhance security, ease of use, and privacy, ensuring a safe platform for college students to connect.

## List of Unit Tests for Backend

### **Test Cases for /register (User Registration)**

| Test Name               | Payload              | Expected Status Code | Expected Response                                 |
| ----------------------- | -------------------- | -------------------- | ------------------------------------------------- |
| Successful Registration | Valid user details   | 201 Created          | `{ "message": "User registered successfully" }` |
| Duplicate Email         | Email already exists | 400 Bad Request      | `{ "error": "email already exists" }`           |
| Missing Required Fields | Incomplete request   | 400 Bad Request      | Validation error message                          |

### **Test Cases for /login (User Login)**

| Test Name        | Payload                       | Expected Status Code | Expected Response                      |
| ---------------- | ----------------------------- | -------------------- | -------------------------------------- |
| Successful Login | Valid credentials             | 200 OK               | `{ "token": "<JWT token>" }`         |
| Invalid Password | Correct email, wrong password | 401 Unauthorized     | `{ "error": "Invalid credentials" }` |
| Email Not Found  | Non-existent email            | 401 Unauthorized     | `{ "error": "Invalid credentials" }` |

### **Test Cases for /profile/:user_id (Get & Update User Profile)**

| Test Name            | User ID         | Payload        | Expected Status Code | Expected Response                                 |
| -------------------- | --------------- | -------------- | -------------------- | ------------------------------------------------- |
| Successful Retrieval | Valid user ID   | -              | 200 OK               | `{ "firstName": "John" }`                       |
| User Not Found       | Non-existent ID | -              | 404 Not Found        | `{ "error": "User not found" }`                 |
| Successful Update    | Valid user ID   | Updated fields | 200 OK               | `{ "message": "Profile updated successfully" }` |

### **Test Cases for /preferences/:user_id (Update User Preferences)**

| Test Name                     | User ID         | Payload             | Expected Status Code | Expected Response                                     |
| ----------------------------- | --------------- | ------------------- | -------------------- | ----------------------------------------------------- |
| Successful Preferences Update | Valid user ID   | Updated preferences | 200 OK               | `{ "message": "Preferences updated successfully" }` |
| User Not Found                | Non-existent ID | Any update request  | 404 Not Found        | `{ "error": "User not found" }`                     |

## Backend API Documentation

### **Base URL**

```
http://localhost:8080
```

### **1. Register a New User**

* **Endpoint** : `POST /register`
* **Request Body** :

```json
  {
    "firstName": "John",
    "email": "john@example.com",
    "password": "password123",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "interestedIn": "Female",
    "lookingFor": "Relationship",
    "interests": ["Hiking", "Reading"],
    "sexualOrientation": "Straight",
    "photos": ["photo1.jpg", "photo2.jpg"]
  }
```

* **Response** :
* Success (201): `{ "message": "User registered successfully" }`
* Error (400): `{ "error": "email already exists" }`

### **2. Login**

* **Endpoint** : `POST /login`
* **Request Body** :

```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
```

* **Response** :
* Success (200): `{ "token": "<JWT token>" }`
* Error (401): `{ "error": "Invalid credentials" }`

### **3. Get User Profile**

* **Endpoint** : `GET /profile/:user_id`
* **Headers** : `Authorization: Bearer <JWT_TOKEN>`
* **Response** :
* Success (200): `{ "id": 1, "firstName": "John", "email": "john@example.com", ... }`
* Error (404): `{ "error": "User not found" }`

### **4. Update User Profile**

* **Endpoint** : `PUT /profile/:user_id`
* **Headers** : `Authorization: Bearer <JWT_TOKEN>`
* **Request Body** :

```json
  {
    "interests": ["Hiking", "Reading", "Cooking"],
    "profilePictureURL": "new_photo.jpg"
  }
```

* **Response** :
* Success (200): `{ "message": "Profile updated successfully" }`
* Error (404): `{ "error": "User not found" }`

### **5. Update User Preferences**

* **Endpoint** : `PUT /preferences/:user_id`
* **Headers** : `Authorization: Bearer <JWT_TOKEN>`
* **Request Body** :

```json
  {
    "ageRange": "25-30",
    "distance": 15,
    "genderPreference": "Female"
  }
```

* **Response** :
* Success (200): `{ "message": "Preferences updated successfully" }`
* Error (404): `{ "error": "User not found" }`
