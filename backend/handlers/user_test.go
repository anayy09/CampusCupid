package handlers

import (
	"bytes"
	"datingapp/database"
	"datingapp/models"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv" // Added for uint to string conversion
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
	// Migrate both User and Interaction models (needed for matches)
	db.AutoMigrate(&models.User{}, &models.Interaction{})
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
	r.GET("/matches/:user_id", GetMatches) // Added new endpoint
	return r
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
	os.RemoveAll("test-results") // Clean up previous results
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
	userID := strconv.Itoa(int(latestUser.ID)) // Convert uint to string

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

	// Fetch the latest user ID dynamically (John's ID)
	var latestUser models.User
	db.Order("id desc").First(&latestUser)
	userID := strconv.Itoa(int(latestUser.ID)) // Convert uint to string

	tests := []struct {
		name         string
		userID       string
		query        string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Matches Retrieval",
			userID:       userID, // John's ID
			query:        "?page=1&limit=10",
			expectedCode: http.StatusOK,
			expectedBody: `"firstName":"Jane"`, // Expect Jane as a match
		},
		{
			name:         "User Not Found",
			userID:       "999",
			query:        "?page=1&limit=10",
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"User not found"}`,
		},
		{
			name:         "Invalid User ID",
			userID:       "invalid",
			query:        "?page=1&limit=10",
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"Invalid user ID"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("GET", "/matches/"+tt.userID+tt.query, nil)
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
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedBody)

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

	// Fetch the latest user IDs dynamically
	var latestReporter, latestTarget models.User
	db.Order("id desc").First(&latestReporter)
	db.Where("email = ?", "bob@example.com").First(&latestTarget)
	targetID := strconv.Itoa(int(latestTarget.ID))

	tests := []struct {
		name         string
		targetID     string
		requestBody  string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Report",
			targetID:     targetID,
			requestBody:  `{"reason": "Inappropriate messages"}`,
			expectedCode: http.StatusCreated,
			expectedBody: `{"message":"Report submitted successfully"}`,
		},
		{
			name:         "Target User Not Found",
			targetID:     "999",
			requestBody:  `{"reason": "Spam"}`,
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"Target user not found"}`,
		},
		{
			name:         "Missing Reason",
			targetID:     targetID,
			requestBody:  `{}`,
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"Reason is required"}`,
		},
		{
			name:         "Report Self",
			targetID:     strconv.Itoa(int(latestReporter.ID)),
			requestBody:  `{"reason": "Testing"}`,
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"You cannot report yourself"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body := bytes.NewBufferString(tt.requestBody)
			req, _ := http.NewRequest("POST", "/report/"+tt.targetID, body)
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

	// Fetch the latest user IDs dynamically
	var latestBlocker, latestTarget models.User
	db.Order("id desc").First(&latestBlocker)
	db.Where("email = ?", "bob@example.com").First(&latestTarget)
	targetID := strconv.Itoa(int(latestTarget.ID))

	tests := []struct {
		name         string
		targetID     string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Block",
			targetID:     targetID,
			expectedCode: http.StatusOK,
			expectedBody: `{"message":"User blocked successfully"}`,
		},
		{
			name:         "Target User Not Found",
			targetID:     "999",
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"Target user not found"}`,
		},
		{
			name:         "Block Self",
			targetID:     strconv.Itoa(int(latestBlocker.ID)),
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"You cannot block yourself"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("POST", "/block/"+tt.targetID, nil)
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

	// Fetch the latest user IDs dynamically
	var latestBlocker, latestTarget models.User
	db.Order("id desc").First(&latestBlocker)
	db.Where("email = ?", "bob@example.com").First(&latestTarget)
	targetID := strconv.Itoa(int(latestTarget.ID))

	// Block the target user first
	latestBlocker.BlockedUsers = append(latestBlocker.BlockedUsers, latestTarget.ID)
	db.Save(&latestBlocker)

	tests := []struct {
		name         string
		targetID     string
		expectedCode int
		expectedBody string
	}{
		{
			name:         "Successful Unblock",
			targetID:     targetID,
			expectedCode: http.StatusOK,
			expectedBody: `{"message":"User unblocked successfully"}`,
		},
		{
			name:         "Target User Not Found",
			targetID:     "999",
			expectedCode: http.StatusNotFound,
			expectedBody: `{"error":"Target user not found"}`,
		},
		{
			name:         "User Not Blocked",
			targetID:     targetID, // Run after unblocking to test non-blocked state
			expectedCode: http.StatusBadRequest,
			expectedBody: `{"error":"User is not blocked"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest("DELETE", "/block/"+tt.targetID, nil)
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

			// For the "User Not Blocked" test, ensure the user is unblocked after the first test
			if tt.name == "Successful Unblock" {
				var updatedUser models.User
				db.Where("id = ?", latestBlocker.ID).First(&updatedUser)
				updatedUser.BlockedUsers = []uint{} // Clear blocked list for next test
				db.Save(&updatedUser)
			}
		})
	}
}
