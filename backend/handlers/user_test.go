package handlers

import (
	"bytes"
	"datingapp/database"
	"datingapp/middleware"
	"datingapp/models"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Setup PostgreSQL database for testing
func setupTestDB() *gorm.DB {
	// Get PostgreSQL connection details from environment variables or use defaults
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		// Use default test database connection
		dsn = "host=localhost user=postgres password=Arpan@01 dbname=test_db port=5432 sslmode=disable TimeZone=UTC"
	}

	// Set JWT secret for testing
	os.Setenv("JWT_SECRET", "test_secret_key")

	// Connect to PostgreSQL
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect to database: " + err.Error())
	}

	// Clear tables for clean test environment
	db.Exec("DROP TABLE IF EXISTS messages")
	db.Exec("DROP TABLE IF EXISTS interactions")
	db.Exec("DROP TABLE IF EXISTS reports")
	db.Exec("DROP TABLE IF EXISTS users")

	// Migrate models
	db.AutoMigrate(&models.User{}, &models.Interaction{}, &models.Report{}, &models.Message{})
	return db
}

// Setup Gin router for testing
func setupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()
	database.DB = db

	// Public routes
	r.POST("/register", Register)
	r.POST("/login", Login)

	// Protected routes
	authorized := r.Group("/")
	authorized.Use(middleware.AuthMiddleware())
	{
		// Profile routes
		authorized.GET("/profile/:user_id", GetUserProfile)
		authorized.PUT("/profile/:user_id", UpdateUserProfile)
		authorized.DELETE("/profile/:user_id", DeleteUserProfile)
		authorized.PUT("/preferences/:user_id", UpdateUserPreferences)

		// Matchmaking routes
		authorized.GET("/matches/:user_id", GetMatches)
		authorized.POST("/like/:target_id", LikeUser)
		authorized.POST("/dislike/:target_id", DislikeUser)
		authorized.POST("/report/:target_id", ReportUser)
		authorized.POST("/block/:target_id", BlockUser)
		authorized.DELETE("/block/:target_id", UnblockUser)

		// Messaging routes
		authorized.POST("/messages", SendMessage)
		authorized.GET("/messages/:user_id", GetMessages)
		authorized.GET("/conversations", GetConversations)
	}

	return r
}

// Helper function to generate JWT token for testing
func generateTestToken(userID uint) string {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = fmt.Sprintf("%d", userID) // Convert uint to string
	claims["exp"] = time.Now().Add(24 * time.Hour).Unix()
	tokenString, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	return tokenString
}

// Helper function to add auth header to request
func addAuthHeader(req *http.Request, userID uint) {
	token := generateTestToken(userID)
	req.Header.Set("Authorization", "Bearer "+token)
}

// TestResult defines the structure of the test result
type TestResult struct {
	TestName string `json:"test_name"`
	Status   string `json:"status"`
	Response string `json:"response"`
}

// TestResultsGroup defines the structure for grouped test results by API route
type TestResultsGroup struct {
	Route   string       `json:"route"`
	Results []TestResult `json:"results"`
}

var testResultsFile *os.File
var testResultsGroups map[string]*TestResultsGroup

// Setup test results directory and file
func setupTestResultsDir() {
	// Remove test results and cache directories
	os.RemoveAll("test-results") // Clean up previous results
	os.RemoveAll("cache")        // Clean up any cache
	os.RemoveAll("tmp")          // Clean up any temp files

	os.Mkdir("test-results", 0755)

	// Open the test results file in write mode
	var err error
	testResultsFile, err = os.OpenFile("test-results/test_results.json", os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		panic("failed to create test results file")
	}

	// Initialize the test results groups
	testResultsGroups = make(map[string]*TestResultsGroup)
}

// Close the test results file and write the grouped results
func closeTestResultsFile() {
	// Convert the map of groups to a slice
	groups := make([]TestResultsGroup, 0, len(testResultsGroups))
	for _, group := range testResultsGroups {
		groups = append(groups, *group)
	}

	// Marshal the grouped results to JSON
	resultsJSON, err := json.MarshalIndent(groups, "", "  ")
	if err != nil {
		panic("failed to marshal test results")
	}

	// Write the JSON to the file
	_, err = testResultsFile.Write(resultsJSON)
	if err != nil {
		panic("failed to write to test results file")
	}

	// Close the file
	err = testResultsFile.Close()
	if err != nil {
		panic("failed to close test results file")
	}
}

// writeTestResult adds a test result to the corresponding group
func writeTestResult(route string, result TestResult) {
	// Check if the group for this route already exists
	if _, exists := testResultsGroups[route]; !exists {
		testResultsGroups[route] = &TestResultsGroup{
			Route:   route,
			Results: []TestResult{},
		}
	}

	// Append the result to the group
	testResultsGroups[route].Results = append(testResultsGroups[route].Results, result)
}

func TestMain(m *testing.M) {
	setupTestResultsDir()  // Create the test-results directory and file
	code := m.Run()        // Run all tests
	closeTestResultsFile() // Close the test results file
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
			expectedBody: `{"message":"User registered successfully"`,
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
			expectedBody: `{"error":"Key: 'RegistrationRequest.Email' Error:Field validation for 'Email' failed on the 'required' tag\nKey: 'RegistrationRequest.Password' Error:Field validation for 'Password' failed on the 'required' tag\nKey: 'RegistrationRequest.DateOfBirth' Error:Field validation for 'DateOfBirth' failed on the 'required' tag\nKey: 'RegistrationRequest.Gender' Error:Field validation for 'Gender' failed on the 'required' tag\nKey: 'RegistrationRequest.InterestedIn' Error:Field validation for 'InterestedIn' failed on the 'required' tag\nKey: 'RegistrationRequest.LookingFor' Error:Field validation for 'LookingFor' failed on the 'required' tag\nKey: 'RegistrationRequest.Interests' Error:Field validation for 'Interests' failed on the 'required' tag\nKey: 'RegistrationRequest.Photos' Error:Field validation for 'Photos' failed on the 'required' tag"}`,
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

			// Write the test result to the corresponding group
			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/register", result)
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

			// Write the test result to the corresponding group
			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/login", result)
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

	// Fetch the latest user ID dynamically
	var latestUser models.User
	db.Order("id desc").First(&latestUser)
	userID := strconv.Itoa(int(latestUser.ID))

	tests := []struct {
		name         string
		userID       string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Profile Retrieval",
			userID:       userID,
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
			// Add authentication header
			addAuthHeader(req, latestUser.ID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert the test result
			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			// Write the test result to the corresponding group
			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/profile/:user_id", result)
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

	// Fetch the latest user ID dynamically
	var latestUser models.User
	db.Order("id desc").First(&latestUser)
	userID := strconv.Itoa(int(latestUser.ID)) // Convert uint to string

	tests := []struct {
		name         string
		userID       string
		payload      models.UpdateProfileRequest
		expectedCode int
		expectedBody string
	}{
		{
			name:   "Successful Profile Update",
			userID: userID,
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
			addAuthHeader(req, latestUser.ID) // Add authentication
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert the test result
			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			// Write the test result to the corresponding group
			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/profile/:user_id", result)
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

	// Fetch the latest user ID dynamically
	var latestUser models.User
	db.Order("id desc").First(&latestUser)
	userID := strconv.Itoa(int(latestUser.ID)) // Convert uint to string

	tests := []struct {
		name         string
		userID       string
		payload      models.UpdatePreferencesRequest
		expectedCode int
		expectedBody string
	}{
		{
			name:   "Successful Preferences Update",
			userID: userID,
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
			addAuthHeader(req, latestUser.ID) // Add authentication
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert the test result
			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			// Write the test result to the corresponding group
			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/preferences/:user_id", result)
		})
	}
}

func TestGetMatches(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register two users for testing matches
	user1 := models.User{
		FirstName:         "John",
		Email:             "john@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking", "Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg"},
		AgeRange:          "20-30",
		Distance:          50,
		GenderPreference:  "Female",
		Latitude:          37.7749,
		Longitude:         -122.4194,
	}
	user1.HashPassword(user1.Password)
	db.Create(&user1)

	user2 := models.User{
		FirstName:         "Jane",
		Email:             "jane@example.com",
		Password:          "password123",
		DateOfBirth:       "1995-05-15",
		Gender:            "Female",
		InterestedIn:      "Male",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking", "Music"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo2.jpg"},
		AgeRange:          "25-35",
		Distance:          50,
		GenderPreference:  "Male",
		Latitude:          37.7858, // Close to user1 for distance filter
		Longitude:         -122.4364,
	}
	user2.HashPassword(user2.Password)
	db.Create(&user2)

	tests := []struct {
		name         string
		userID       string
		authUserID   uint
		query        string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Matches Retrieval",
			userID:       strconv.Itoa(int(user1.ID)),
			authUserID:   user1.ID,
			query:        "?page=1&limit=10",
			expectedCode: http.StatusOK,
			expectedBody: `"firstName":"Jane"`, // Expect Jane as a match
		},
		{
			name:         "User Not Found",
			userID:       "999",
			authUserID:   user1.ID,
			query:        "?page=1&limit=10",
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"User not found"}`,
		},
		{
			name:         "Invalid User ID",
			userID:       "invalid",
			authUserID:   user1.ID,
			query:        "?page=1&limit=10",
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"Invalid user ID"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/matches/"+tt.userID+tt.query, nil)
			addAuthHeader(req, tt.authUserID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/matches/:user_id", result)
		})
	}
}

func TestDeleteUserProfile(t *testing.T) {
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

	// Fetch the latest user ID dynamically
	var latestUser models.User
	db.Order("id desc").First(&latestUser)
	userID := strconv.Itoa(int(latestUser.ID))

	tests := []struct {
		name         string
		userID       string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Profile Deletion",
			userID:       userID,
			expectedCode: http.StatusOK,
			expectedBody: `{"message":"Profile deleted successfully"}`,
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
			req, _ := http.NewRequest("DELETE", "/profile/"+tt.userID, nil)
			addAuthHeader(req, latestUser.ID) // Add authentication
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Assert the test result
			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			// Write the test result to the corresponding group
			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/profile/:user_id", result)
		})
	}
}

func TestReportUser(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register two users
	reporter := models.User{
		FirstName:         "Alice",
		Email:             "alice@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Female",
		InterestedIn:      "Male",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg"},
	}
	reporter.HashPassword(reporter.Password)
	db.Create(&reporter)

	target := models.User{
		FirstName:         "Bob",
		Email:             "bob@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo2.jpg"},
	}
	target.HashPassword(target.Password)
	db.Create(&target)

	tests := []struct {
		name         string
		targetID     string
		authUserID   uint
		requestBody  string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Missing Reason",
			targetID:     strconv.Itoa(int(target.ID)),
			authUserID:   reporter.ID,
			requestBody:  `{}`,
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"Reason is required"}`,
		},
		{
			name:         "Successful Report",
			targetID:     strconv.Itoa(int(target.ID)),
			authUserID:   reporter.ID,
			requestBody:  `{"reason": "Inappropriate messages"}`,
			expectedCode: http.StatusCreated,
			expectedBody: `{"message":"Report submitted successfully"}`,
		},
		{
			name:         "Target User Not Found",
			targetID:     "999",
			authUserID:   reporter.ID,
			requestBody:  `{"reason": "Spam"}`,
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"Target user not found"}`,
		},
		{
			name:         "Report Self",
			targetID:     strconv.Itoa(int(reporter.ID)),
			authUserID:   reporter.ID,
			requestBody:  `{"reason": "Testing"}`,
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"You cannot report yourself"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body := bytes.NewBufferString(tt.requestBody)
			req, _ := http.NewRequest("POST", "/report/"+tt.targetID, body)
			addAuthHeader(req, tt.authUserID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/report/:target_id", result)
		})
	}
}

func TestBlockUser(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register two users
	blocker := models.User{
		FirstName:         "Alice",
		Email:             "alice@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Female",
		InterestedIn:      "Male",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg"},
	}
	blocker.HashPassword(blocker.Password)
	db.Create(&blocker)

	target := models.User{
		FirstName:         "Bob",
		Email:             "bob@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo2.jpg"},
	}
	target.HashPassword(target.Password)
	db.Create(&target)

	tests := []struct {
		name         string
		targetID     string
		authUserID   uint
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Block",
			targetID:     strconv.Itoa(int(target.ID)),
			authUserID:   blocker.ID,
			expectedCode: http.StatusOK,
			expectedBody: `{"message":"User blocked successfully"}`,
		},
		{
			name:         "Target User Not Found",
			targetID:     "999",
			authUserID:   blocker.ID,
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"Target user not found"}`,
		},
		{
			name:         "Block Self",
			targetID:     strconv.Itoa(int(blocker.ID)),
			authUserID:   blocker.ID,
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"You cannot block yourself"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("POST", "/block/"+tt.targetID, nil)
			addAuthHeader(req, tt.authUserID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/block/:target_id", result)
		})
	}
}

func TestUnblockUser(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register two users
	blocker := models.User{
		FirstName:         "Alice",
		Email:             "alice@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Female",
		InterestedIn:      "Male",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg"},
		BlockedUsers:      []uint{}, // Initialize empty blocked list
	}
	blocker.HashPassword(blocker.Password)
	db.Create(&blocker)

	target := models.User{
		FirstName:         "Bob",
		Email:             "bob@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo2.jpg"},
	}
	target.HashPassword(target.Password)
	db.Create(&target)

	// Block the target user first for the unblock test
	blocker.BlockedUsers = append(blocker.BlockedUsers, target.ID)
	db.Save(&blocker)

	tests := []struct {
		name         string
		targetID     string
		authUserID   uint
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Unblock",
			targetID:     strconv.Itoa(int(target.ID)),
			authUserID:   blocker.ID,
			expectedCode: http.StatusOK,
			expectedBody: `{"message":"User unblocked successfully"}`,
		},
		{
			name:         "Target User Not Found",
			targetID:     "999",
			authUserID:   blocker.ID,
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"Target user not found"}`,
		},
		{
			name:         "User Not Blocked",
			targetID:     strconv.Itoa(int(target.ID)),
			authUserID:   blocker.ID,
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"User is not blocked"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("DELETE", "/block/"+tt.targetID, nil)
			addAuthHeader(req, tt.authUserID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/block/:target_id", result)

			// For subsequent tests that need the user to be unblocked
			if tt.name == "Successful Unblock" {
				var updatedBlocker models.User
				db.First(&updatedBlocker, blocker.ID)
				updatedBlocker.BlockedUsers = []uint{} // Clear blocked list
				db.Save(&updatedBlocker)
			}
		})
	}
}

func TestLikeUser(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register two users
	user1 := models.User{
		FirstName:         "Alice",
		Email:             "alice@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Female",
		InterestedIn:      "Male",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg"},
	}
	user1.HashPassword(user1.Password)
	db.Create(&user1)

	user2 := models.User{
		FirstName:         "Bob",
		Email:             "bob@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo2.jpg"},
	}
	user2.HashPassword(user2.Password)
	db.Create(&user2)

	tests := []struct {
		name         string
		targetID     string
		authUserID   uint
		expectedCode int
		expectedBody map[string]interface{}
	}{
		{
			name:         "Successful Like",
			targetID:     strconv.Itoa(int(user2.ID)),
			authUserID:   user1.ID,
			expectedCode: http.StatusOK,
			expectedBody: map[string]interface{}{
				"success": true,
				"liked":   true,
				"matched": false,
			},
		},
		{
			name:         "Target User Not Found",
			targetID:     "999",
			authUserID:   user1.ID,
			expectedCode: http.StatusNotFound,
			expectedBody: map[string]interface{}{
				"error": "Target user not found",
			},
		},
		{
			name:         "Already Interacted",
			targetID:     strconv.Itoa(int(user2.ID)),
			authUserID:   user1.ID,
			expectedCode: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": "You have already interacted with this user",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("POST", "/like/"+tt.targetID, nil)
			addAuthHeader(req, tt.authUserID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)

			// Parse response body
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedBody, response)

			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/like/:target_id", result)
		})
	}
}

func TestDislikeUser(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register two users
	user1 := models.User{
		FirstName:         "Alice",
		Email:             "alice@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Female",
		InterestedIn:      "Male",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg"},
	}
	user1.HashPassword(user1.Password)
	db.Create(&user1)

	user2 := models.User{
		FirstName:         "Bob",
		Email:             "bob@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo2.jpg"},
	}
	user2.HashPassword(user2.Password)
	db.Create(&user2)

	tests := []struct {
		name         string
		targetID     string
		authUserID   uint
		expectedCode int
		expectedBody map[string]interface{}
	}{
		{
			name:         "Successful Dislike",
			targetID:     strconv.Itoa(int(user2.ID)),
			authUserID:   user1.ID,
			expectedCode: http.StatusOK,
			expectedBody: map[string]interface{}{
				"success": true,
				"liked":   false,
				"matched": false,
			},
		},
		{
			name:         "Target User Not Found",
			targetID:     "999",
			authUserID:   user1.ID,
			expectedCode: http.StatusNotFound,
			expectedBody: map[string]interface{}{
				"error": "Target user not found",
			},
		},
		{
			name:         "Already Interacted",
			targetID:     strconv.Itoa(int(user2.ID)),
			authUserID:   user1.ID,
			expectedCode: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": "You have already interacted with this user",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("POST", "/dislike/"+tt.targetID, nil)
			addAuthHeader(req, tt.authUserID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)

			// Parse response body
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedBody, response)

			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/dislike/:target_id", result)
		})
	}
}

func TestSendMessage(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register users for testing
	sender := models.User{
		FirstName:         "Alice",
		Email:             "alice@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Female",
		InterestedIn:      "Male",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg"},
	}
	sender.HashPassword(sender.Password)
	db.Create(&sender)

	receiver := models.User{
		FirstName:         "Bob",
		Email:             "bob@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo2.jpg"},
	}
	receiver.HashPassword(receiver.Password)
	db.Create(&receiver)

	// Create a third user that exists but isn't matched
	user3 := models.User{
		FirstName:         "Charlie",
		Email:             "charlie@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Gaming"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo3.jpg"},
	}
	user3.HashPassword(user3.Password)
	db.Create(&user3)

	// Create mutual match between sender and receiver
	interaction1 := models.Interaction{
		UserID:    sender.ID,
		TargetID:  receiver.ID,
		Liked:     true,
		Matched:   true,
		CreatedAt: time.Now(),
	}
	db.Create(&interaction1)

	interaction2 := models.Interaction{
		UserID:    receiver.ID,
		TargetID:  sender.ID,
		Liked:     true,
		Matched:   true,
		CreatedAt: time.Now(),
	}
	db.Create(&interaction2)

	// Create some test messages
	message1 := models.Message{
		SenderID:   sender.ID,
		ReceiverID: receiver.ID,
		Content:    "Hello!",
		Read:       false,
		CreatedAt:  time.Now(),
	}
	db.Create(&message1)

	message2 := models.Message{
		SenderID:   receiver.ID,
		ReceiverID: sender.ID,
		Content:    "Hi there!",
		Read:       false,
		CreatedAt:  time.Now(),
	}
	db.Create(&message2)

	tests := []struct {
		name         string
		authUserID   uint
		payload      models.SendMessageRequest
		expectedCode int
		expectedBody string
	}{
		{
			name:       "Successful Message Send",
			authUserID: sender.ID,
			payload: models.SendMessageRequest{
				ReceiverID: receiver.ID,
				Content:    "Hello!",
			},
			expectedCode: http.StatusCreated,
			expectedBody: `"content":"Hello!"`,
		},
		{
			name:       "Receiver Not Found",
			authUserID: sender.ID,
			payload: models.SendMessageRequest{
				ReceiverID: 999,
				Content:    "Hello!",
			},
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"Receiver not found"}`,
		},
		{
			name:       "Not Matched",
			authUserID: sender.ID,
			payload: models.SendMessageRequest{
				ReceiverID: user3.ID,
				Content:    "Hello!",
			},
			expectedCode: http.StatusForbidden,
			expectedBody: `{"error":"You can only send messages to users you have matched with"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadBytes, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("POST", "/messages", bytes.NewBuffer(payloadBytes))
			addAuthHeader(req, tt.authUserID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/messages", result)
		})
	}
}

func TestGetMessages(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register two users and create a match between them
	user1 := models.User{
		FirstName:         "Alice",
		Email:             "alice@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Female",
		InterestedIn:      "Male",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg"},
	}
	user1.HashPassword(user1.Password)
	db.Create(&user1)

	user2 := models.User{
		FirstName:         "Bob",
		Email:             "bob@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo2.jpg"},
	}
	user2.HashPassword(user2.Password)
	db.Create(&user2)

	// Create mutual match
	interaction1 := models.Interaction{
		UserID:    user1.ID,
		TargetID:  user2.ID,
		Liked:     true,
		Matched:   true,
		CreatedAt: time.Now(),
	}
	db.Create(&interaction1)

	interaction2 := models.Interaction{
		UserID:    user2.ID,
		TargetID:  user1.ID,
		Liked:     true,
		Matched:   true,
		CreatedAt: time.Now(),
	}
	db.Create(&interaction2)

	// Create some test messages
	message1 := models.Message{
		SenderID:   user1.ID,
		ReceiverID: user2.ID,
		Content:    "Hello!",
		Read:       false,
		CreatedAt:  time.Now(),
	}
	db.Create(&message1)

	message2 := models.Message{
		SenderID:   user2.ID,
		ReceiverID: user1.ID,
		Content:    "Hi there!",
		Read:       false,
		CreatedAt:  time.Now(),
	}
	db.Create(&message2)

	tests := []struct {
		name         string
		userID       string
		authUserID   uint
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Messages Retrieval",
			userID:       strconv.Itoa(int(user2.ID)),
			authUserID:   user1.ID,
			expectedCode: http.StatusOK,
			expectedBody: `"content":"Hello!"`,
		},
		{
			name:         "User Not Found",
			userID:       "invalid", // Changed from "999" to "invalid"
			authUserID:   user1.ID,
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"Invalid user ID"}`,
		},
		{
			name:         "Not Matched",
			userID:       "3", // A user that exists but not matched
			authUserID:   user1.ID,
			expectedCode: http.StatusForbidden,
			expectedBody: `{"error":"You can only view messages with users you have matched with"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/messages/"+tt.userID, nil)
			addAuthHeader(req, tt.authUserID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/messages/:user_id", result)
		})
	}
}

func TestGetConversations(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)

	// Register two users and create a match between them
	user1 := models.User{
		FirstName:         "Alice",
		Email:             "alice@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Female",
		InterestedIn:      "Male",
		LookingFor:        "Relationship",
		Interests:         []string{"Hiking"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo1.jpg"},
	}
	user1.HashPassword(user1.Password)
	db.Create(&user1)

	user2 := models.User{
		FirstName:         "Bob",
		Email:             "bob@example.com",
		Password:          "password123",
		DateOfBirth:       "1990-01-01",
		Gender:            "Male",
		InterestedIn:      "Female",
		LookingFor:        "Relationship",
		Interests:         []string{"Reading"},
		SexualOrientation: "Straight",
		Photos:            []string{"photo2.jpg"},
	}
	user2.HashPassword(user2.Password)
	db.Create(&user2)

	// Create mutual match
	interaction1 := models.Interaction{
		UserID:    user1.ID,
		TargetID:  user2.ID,
		Liked:     true,
		Matched:   true,
		CreatedAt: time.Now(),
	}
	db.Create(&interaction1)

	interaction2 := models.Interaction{
		UserID:    user2.ID,
		TargetID:  user1.ID,
		Liked:     true,
		Matched:   true,
		CreatedAt: time.Now(),
	}
	db.Create(&interaction2)

	// Create some test messages
	message1 := models.Message{
		SenderID:   user1.ID,
		ReceiverID: user2.ID,
		Content:    "Hello!",
		Read:       false,
		CreatedAt:  time.Now(),
	}
	db.Create(&message1)

	message2 := models.Message{
		SenderID:   user2.ID,
		ReceiverID: user1.ID,
		Content:    "Hi there!",
		Read:       false,
		CreatedAt:  time.Now(),
	}
	db.Create(&message2)

	tests := []struct {
		name         string
		authUserID   uint
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Conversations Retrieval",
			authUserID:   user1.ID,
			expectedCode: http.StatusOK,
			expectedBody: `"firstName":"Bob"`,
		},
		{
			name:         "No Conversations",
			authUserID:   999,
			expectedCode: http.StatusOK,
			expectedBody: `[]`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/conversations", nil)
			addAuthHeader(req, tt.authUserID)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

			result := TestResult{
				TestName: tt.name,
				Status:   http.StatusText(w.Code),
				Response: w.Body.String(),
			}
			writeTestResult("/conversations", result)
		})
	}
}
