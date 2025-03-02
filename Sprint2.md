### **Base URL**

```
http://localhost:8080
```

---

### **1. Register a New User**

- **Endpoint**: `POST /register`
- **Description**: Register a new user with the provided details.
- **Request Body**:
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
- **Response**:
  - Success (201):
    ```json
    {
      "message": "User registered successfully"
    }
    ```
  - Error (400):
    ```json
    {
      "error": "email already exists"
    }
    ```

---

### **2. Login**

- **Endpoint**: `POST /login`
- **Description**: Authenticate a user and return a JWT token.
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  - Success (200):
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
  - Error (401):
    ```json
    {
      "error": "Invalid credentials"
    }
    ```

---

### **3. Get User Profile**

- **Endpoint**: `GET /profile/:user_id`
- **Description**: Retrieve the profile details of a user by their ID.
- **Headers**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Response**:
  - Success (200):
    ```json
    {
      "id": 1,
      "firstName": "John",
      "email": "john@example.com",
      "dateOfBirth": "1990-01-01",
      "gender": "Male",
      "interestedIn": "Female",
      "lookingFor": "Relationship",
      "interests": ["Hiking", "Reading"],
      "sexualOrientation": "Straight",
      "photos": ["photo1.jpg", "photo2.jpg"],
      "ageRange": "25-30",
      "distance": 10,
      "genderPreference": "Female"
    }
    ```
  - Error (404):
    ```json
    {
      "error": "User not found"
    }
    ```

---

### **4. Update User Profile**

- **Endpoint**: `PUT /profile/:user_id`
- **Description**: Update the profile details of a user.
- **Headers**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Request Body**:
  ```json
  {
    "interests": ["Hiking", "Reading", "Cooking"],
    "profilePictureURL": "new_photo.jpg",
    "firstName": "John",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "interestedIn": "Female",
    "lookingFor": "Relationship",
    "sexualOrientation": "Straight",
    "photos": ["photo1.jpg", "photo2.jpg", "photo3.jpg"],
    "ageRange": "25-30",
    "distance": 10,
    "genderPreference": "Female"
  }
  ```
- **Response**:
  - Success (200):
    ```json
    {
      "message": "Profile updated successfully"
    }
    ```
  - Error (404):
    ```json
    {
      "error": "User not found"
    }
    ```

---

### **5. Update User Preferences**

- **Endpoint**: `PUT /preferences/:user_id`
- **Description**: Update the user's preferences (age range, distance, gender preference).
- **Headers**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Request Body**:
  ```json
  {
    "ageRange": "25-30",
    "distance": 15,
    "genderPreference": "Female"
  }
  ```
- **Response**:
  - Success (200):
    ```json
    {
      "message": "Preferences updated successfully"
    }
    ```
  - Error (404):
    ```json
    {
      "error": "User not found"
    }
    ```
