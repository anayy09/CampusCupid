package handlers

import (
	"bytes"
	"datingapp/database"
	"datingapp/models"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Setup in-memory SQLite database for testing
func setupTestDB() *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect to database")
	}
	db.AutoMigrate(&models.User{})
	return db
}

// Setup Gin router for testing
func setupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()
	database.DB = db
	r.POST("/register", Register)
	r.POST("/login", Login)
	r.GET("/profile/:user_id", GetUserProfile)
	r.PUT("/profile/:user_id", UpdateUserProfile)
	r.PUT("/preferences/:user_id", UpdateUserPreferences)
	return r
}

// TestResult defines the structure of the test result
type TestResult struct {
	TestName string `json:"test_name"`
	API      string `json:"api"`
	Status   string `json:"status"`
	Response string `json:"response"`
}

// writeTestResult writes the test result to a file in JSON format
func writeTestResult(filename string, result TestResult) error {
	file, err := os.OpenFile(filename, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	resultJSON, err := json.Marshal(result)
	if err != nil {
		return err
	}

	_, err = file.WriteString(string(resultJSON) + "\n")
	return err
}

// Setup test results directory
func setupTestResultsDir() {
	os.RemoveAll("test-results") // Clean up previous results
	os.Mkdir("test-results", 0755)
}

func TestMain(m *testing.M) {
	setupTestResultsDir() // Create the test-results directory
	code := m.Run()       // Run all tests
	os.Exit(code)
}

func TestRegister(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	tests := []struct {
		name         string
		payload      models.RegistrationRequest
		expectedCode int
		expectedBody string
	}{
		{
			name: "Successful Registration",
			payload: models.RegistrationRequest{
				FirstName:         "John",
				Email:             "john@example.com",
				Password:          "password123",
				DateOfBirth:       "1990-01-01",
				Gender:            "Male",
				InterestedIn:      "Female",
				LookingFor:        "Relationship",
				Interests:         []string{"Hiking", "Reading"},
				SexualOrientation: "Straight",
				Photos:            []string{"photo1.jpg", "photo2.jpg"},
			},
			expectedCode: http.StatusCreated,
			expectedBody: `{"message":"User registered successfully"}`,
		},
		{
			name: "Duplicate Email",
			payload: models.RegistrationRequest{
				FirstName:         "Jane",
				Email:             "john@example.com", // Duplicate email
				Password:          "password123",
				DateOfBirth:       "1990-01-01",
				Gender:            "Female",
				InterestedIn:      "Male",
				LookingFor:        "Relationship",
				Interests:         []string{"Hiking", "Reading"},
				SexualOrientation: "Straight",
				Photos:            []string{"photo1.jpg", "photo2.jpg"},
			},
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"email already exists"}`,
		},
		{
			name: "Invalid Request (Missing Required Fields)",
			payload: models.RegistrationRequest{
				FirstName: "John", // Missing email, password, etc.
			},
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"Key: 'RegistrationRequest.Email' Error:Field validation for 'Email' failed on the 'required' tag`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadBytes, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("POST", "/register", bytes.NewBuffer(payloadBytes))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert the test result
			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			// Write the test result to a file
			result := TestResult{
				TestName: tt.name,
				API:      "/register",
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			err := writeTestResult("test-results/test_results.json", result)
			if err != nil {
				t.Errorf("Failed to write test result: %v", err)
			}
		})
	}
}

func TestLogin(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register a user first
	user := models.User{
		FirstName:         "John",
		Email:             "john@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking", "Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg", "photo2.jpg"},
	}
	user.HashPassword(user.Password)
	db.Create(&user)

	tests := []struct {
		name         string
		payload      models.LoginRequest
		expectedCode int
		expectedBody string
	}{
		{
			name: "Successful Login",
			payload: models.LoginRequest{
				Email:    "john@example.com",
				Password: "password123",
			},
			expectedCode: http.StatusOK,
			expectedBody: `{"token":"`,
		},
		{
			name: "Invalid Credentials (Wrong Password)",
			payload: models.LoginRequest{
				Email:    "john@example.com",
				Password: "wrongpassword",
			},
			expectedCode: http.StatusUnauthorized,
			expectedBody: `{"error":"Invalid credentials"}`,
		},
		{
			name: "Invalid Credentials (Non-Existent Email)",
			payload: models.LoginRequest{
				Email:    "nonexistent@example.com",
				Password: "password123",
			},
			expectedCode: http.StatusUnauthorized,
			expectedBody: `{"error":"Invalid credentials"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadBytes, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(payloadBytes))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert the test result
			assert.Equal(t, tt.expectedCode, w.Code)
			if tt.name == "Successful Login" {
				assert.Contains(t, w.Body.String(), tt.expectedBody)
			} else {
				assert.Equal(t, tt.expectedBody, w.Body.String())
			}

			// Write the test result to a file
			result := TestResult{
				TestName: tt.name,
				API:      "/login",
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			err := writeTestResult("test-results/test_results.json", result)
			if err != nil {
				t.Errorf("Failed to write test result: %v", err)
			}
		})
	}
}

func TestGetUserProfile(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register a user first
	user := models.User{
		FirstName:         "John",
		Email:             "john@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking", "Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg", "photo2.jpg"},
	}
	user.HashPassword(user.Password)
	db.Create(&user)

	tests := []struct {
		name         string
		userID       string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Profile Retrieval",
			userID:       "1",
			expectedCode: http.StatusOK,
			expectedBody: `"firstName":"John"`,
		},
		{
			name:         "User Not Found",
			userID:       "999",
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"User not found"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/profile/"+tt.userID, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert the test result
			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			// Write the test result to a file
			result := TestResult{
				TestName: tt.name,
				API:      "/profile/" + tt.userID,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			err := writeTestResult("test-results/test_results.json", result)
			if err != nil {
				t.Errorf("Failed to write test result: %v", err)
			}
		})
	}
}

func TestUpdateUserProfile(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register a user first
	user := models.User{
		FirstName:         "John",
		Email:             "john@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking", "Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg", "photo2.jpg"},
	}
	user.HashPassword(user.Password)
	db.Create(&user)

	tests := []struct {
		name         string
		userID       string
		payload      models.UpdateProfileRequest
		expectedCode int
		expectedBody string
	}{
		{
			name:   "Successful Profile Update",
			userID: "1",
			payload: models.UpdateProfileRequest{
				FirstName:         "John Updated",
				Interests:         []string{"Hiking", "Reading", "Cooking"},
				ProfilePictureURL: "new_photo.jpg",
			},
			expectedCode: http.StatusOK,
			expectedBody: `{"message":"Profile updated successfully"}`,
		},
		{
			name:   "User Not Found",
			userID: "999",
			payload: models.UpdateProfileRequest{
				FirstName: "John Updated",
			},
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"User not found"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadBytes, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("PUT", "/profile/"+tt.userID, bytes.NewBuffer(payloadBytes))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert the test result
			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			// Write the test result to a file
			result := TestResult{
				TestName: tt.name,
				API:      "/profile/" + tt.userID,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			err := writeTestResult("test-results/test_results.json", result)
			if err != nil {
				t.Errorf("Failed to write test result: %v", err)
			}
		})
	}
}

func TestUpdateUserPreferences(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register a user first
	user := models.User{
		FirstName:         "John",
		Email:             "john@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking", "Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg", "photo2.jpg"},
	}
	user.HashPassword(user.Password)
	db.Create(&user)

	tests := []struct {
		name         string
		userID       string
		payload      models.UpdatePreferencesRequest
		expectedCode int
		expectedBody string
	}{
		{
			name:   "Successful Preferences Update",
			userID: "1",
			payload: models.UpdatePreferencesRequest{
				AgeRange:         "25-30",
				Distance:         15,
				GenderPreference: "Female",
			},
			expectedCode: http.StatusOK,
			expectedBody: `{"message":"Preferences updated successfully"}`,
		},
		{
			name:   "User Not Found",
			userID: "999",
			payload: models.UpdatePreferencesRequest{
				AgeRange: "25-30",
			},
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"User not found"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadBytes, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("PUT", "/preferences/"+tt.userID, bytes.NewBuffer(payloadBytes))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert the test result
			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			// Write the test result to a file
			result := TestResult{
				TestName: tt.name,
				API:      "/preferences/" + tt.userID,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			err := writeTestResult("test-results/test_results.json", result)
			if err != nil {
				t.Errorf("Failed to write test result: %v", err)
			}
		})
	}
}
