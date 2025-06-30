package handlers

import (
	"context"
	"datingapp/database"
	"datingapp/models"
	"errors"
	"fmt"
	"log" // Import the log package
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	validator "github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm" // Import gorm
)

// Helper for consistent error responses
func respondWithError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"error": message})
}

// Helper for input validation
func validateInput(c *gin.Context, input interface{}) bool {
	if err := c.ShouldBindJSON(input); err != nil {
		var validationErrors validator.ValidationErrors
		if errors.As(err, &validationErrors) {
			errorMessages := make(map[string]string)
			for _, e := range validationErrors {
				errorMessages[e.Field()] = getValidationErrorMsg(e)
			}
			c.JSON(http.StatusBadRequest, gin.H{"errors": errorMessages})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return false
	}
	return true
}

func getValidationErrorMsg(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Invalid email format"
	default:
		return "Invalid value"
	}
}

// Helper for authentication check
func getAuthenticatedUserID(c *gin.Context) (uint, bool) {
	userIDAny, exists := c.Get("userID")
	if !exists {
		respondWithError(c, http.StatusUnauthorized, "Authentication required")
		return 0, false
	}

	userID, ok := userIDAny.(uint)
	if !ok {
		log.Printf("ERROR: Could not assert userID to uint. Value: %v, Type: %T", userIDAny, userIDAny)
		respondWithError(c, http.StatusInternalServerError, "Internal server error processing user ID")
		return 0, false
	}

	return userID, true
}

// Helper for pagination
func getPaginationParams(c *gin.Context) (limit int, offset int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10 // Default limit with max cap
	}
	offset = (page - 1) * limit
	return limit, offset
}

// Helper for JWT token generation
func generateJWTToken(userID uint) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", errors.New("JWT_SECRET environment variable is not set")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": fmt.Sprintf("%d", userID),
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString([]byte(jwtSecret))
}

// Add structured logger
var logger = log.New(os.Stdout, "[USERS] ", log.LstdFlags)

// Register handles user registration
// @Summary Register a new user
// @Description Create a new user account with profile details
// @Tags users
// @Accept json
// @Produce json
// @Param registration body models.RegistrationRequest true "User registration details"
// @Success 201 {object} map[string]interface{} "User registered successfully"
// @Failure 400 {object} map[string]string "Bad Request (validation errors)"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /register [post]
func Register(c *gin.Context) {
	var req models.RegistrationRequest

	// Bind and validate the request body
	if err := c.ShouldBindJSON(&req); err != nil {
		var verr validator.ValidationErrors
		if errors.As(err, &verr) {
			errors := make(map[string]string)
			for _, f := range verr {
				errors[f.Field()] = fmt.Sprintf("Validation failed on field '%s', condition '%s'", f.Field(), f.Tag())
				// Add more specific messages if needed based on f.Tag()
			}
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed", "details": errors})
			return
		}
		respondWithError(c, http.StatusBadRequest, fmt.Sprintf("Invalid request body: %v", err))
		return
	}

	// Check if email already exists
	var existingUser models.User
	ctxCheck, cancelCheck := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelCheck()
	if err := database.DB.WithContext(ctxCheck).Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		respondWithError(c, http.StatusBadRequest, "Email already registered")
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		respondWithError(c, http.StatusInternalServerError, fmt.Sprintf("Database error checking email: %v", err))
		return
	}
	// Set up profile picture URL from the first photo if available
	var profilePictureURL string
	if len(req.Photos) > 0 {
		profilePictureURL = req.Photos[0]
	}

	user := models.User{
		FirstName: req.FirstName,
		Email:     req.Email,
		// Password will be hashed below
		DateOfBirth:       req.DateOfBirth,
		Gender:            req.Gender,
		InterestedIn:      req.InterestedIn,
		LookingFor:        req.LookingFor,
		Interests:         req.Interests,
		SexualOrientation: req.SexualOrientation,
		Photos:            req.Photos,        // Photos are now expected to be URLs from the upload endpoint
		ProfilePictureURL: profilePictureURL, // Set the profile picture URL to the first photo
		Latitude:          req.Latitude,
		Longitude:         req.Longitude,
	}

	// Hash the password
	if err := user.HashPassword(req.Password); err != nil {
		respondWithError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Save the user to the database
	ctxCreate, cancelCreate := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelCreate()
	result := database.DB.WithContext(ctxCreate).Create(&user)
	if result.Error != nil {
		respondWithError(c, http.StatusInternalServerError, fmt.Sprintf("Failed to create user: %v", result.Error))
		return
	}

	logger.Printf("User registered successfully: ID %d, Email %s", user.ID, user.Email)
	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully", "user_id": user.ID})
}

// Login authenticates a user and returns a JWT token
// @Summary Login a user
// @Description Authenticate a user and return a JWT token
// @Tags users
// @Accept json
// @Produce json
// @Param credentials body models.LoginRequest true "User login credentials"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /login [post]
func Login(c *gin.Context) {
	var input models.LoginRequest

	if !validateInput(c, &input) {
		return
	}

	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := database.DB.WithContext(ctx).Where("email = ?", input.Email).First(&user).Error; err != nil {
		respondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if err := user.CheckPassword(input.Password); err != nil {
		respondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	tokenString, err := generateJWTToken(user.ID)
	if err != nil {
		logger.Printf("ERROR: Could not generate token: %v", err)
		respondWithError(c, http.StatusInternalServerError, "Could not generate token")
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString, "user_id": user.ID})
}

// GetUserProfile retrieves the profile details of the user by user_id
// @Summary Get user profile by user_id
// @Description Get the profile details of a user using the user_id
// @Tags users
// @Accept json
// @Produce json
// @Param user_id path uint true "User ID"
// @Security ApiKeyAuth
// @Success 200 {object} models.User
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /profile/{user_id} [get]
func GetUserProfile(c *gin.Context) {
	authenticatedUserID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	userID := c.Param("user_id")
	paramUserID, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Check if the authenticated user is accessing their own profile
	if uint(paramUserID) != authenticatedUserID {
		respondWithError(c, http.StatusForbidden, "Access denied: You can only view your own profile")
		return
	}

	// Retrieve the user info from the database
	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := database.DB.WithContext(ctx).Where("id = ?", userID).First(&user).Error; err != nil {
		respondWithError(c, http.StatusNotFound, "User not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":                user.ID,
		"firstName":         user.FirstName,
		"email":             user.Email,
		"dateOfBirth":       user.DateOfBirth,
		"gender":            user.Gender,
		"interestedIn":      user.InterestedIn,
		"lookingFor":        user.LookingFor,
		"interests":         user.Interests,
		"sexualOrientation": user.SexualOrientation,
		"photos":            user.Photos,
		"ageRange":          user.AgeRange,
		"distance":          user.Distance,
		"genderPreference":  user.GenderPreference,
		"profilePictureURL": user.ProfilePictureURL,
		"latitude":          user.Latitude,
		"longitude":         user.Longitude,
	})
}

// UpdateUserProfile updates the profile details of the user by user_id
// @Summary Update user profile by user_id
// @Description Update profile details such as bio, interests, and preferences (excluding ID, Username, Email, Password)
// @Tags users
// @Accept json
// @Produce json
// @Param user_id path uint true "User ID"
// @Param profile body models.UpdateProfileRequest true "Updated profile details"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /profile/{user_id} [put]
func UpdateUserProfile(c *gin.Context) {
	authenticatedUserID, ok := getAuthenticatedUserID(c)
	if !ok {
		respondWithError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}

	userID := c.Param("user_id")
	paramUserID, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid user ID format")
		return
	}

	// Check if the authenticated user is updating their own profile
	if uint(paramUserID) != authenticatedUserID {
		respondWithError(c, http.StatusForbidden, "You can only update your own profile")
		return
	}

	// Retrieve user from database
	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := database.DB.WithContext(ctx).First(&user, authenticatedUserID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondWithError(c, http.StatusNotFound, "User not found")
		} else {
			respondWithError(c, http.StatusInternalServerError, fmt.Sprintf("Database error: %v", err))
		}
		return
	}

	var updateData models.UpdateProfileRequest
	// Bind only the fields provided in the request
	if err := c.ShouldBindJSON(&updateData); err != nil {
		respondWithError(c, http.StatusBadRequest, fmt.Sprintf("Invalid request body: %v", err))
		return
	}

	// Input validation (Example for FirstName, add others as needed)
	if updateData.FirstName != "" && len(updateData.FirstName) < 2 {
		respondWithError(c, http.StatusBadRequest, "First name must be at least 2 characters")
		return
	}
	// Add more specific validations for other fields (DateOfBirth format, Gender values, etc.)

	// Use Updates method to update only non-zero/non-empty fields from updateData
	// GORM's Updates method intelligently updates only fields that are present and non-zero/non-empty in the struct.
	// Make sure your UpdateProfileRequest struct fields match the User model fields you want to update.
	// Note: For slices like Interests and Photos, if an empty slice is provided `[]`,
	// it might clear the existing data depending on GORM version and configuration.
	// If you want to allow clearing, this is fine. If not, check if the field is nil before assigning.
	// For ProfilePictureURL, if "" is sent, it will update the DB field to empty.

	updateMap := make(map[string]interface{})

	if updateData.Interests != nil { // Check if Interests field was included in JSON
		updateMap["interests"] = updateData.Interests
	}
	if updateData.ProfilePictureURL != "" { // Allow setting empty string? Decide based on requirements.
		updateMap["profile_picture_url"] = updateData.ProfilePictureURL
	}
	if updateData.FirstName != "" {
		updateMap["first_name"] = updateData.FirstName
	}
	if updateData.DateOfBirth != "" {
		// Add validation for date format here if needed
		updateMap["date_of_birth"] = updateData.DateOfBirth
	}
	if updateData.Gender != "" {
		// Add validation for allowed gender values
		updateMap["gender"] = updateData.Gender
	}
	if updateData.InterestedIn != "" {
		updateMap["interested_in"] = updateData.InterestedIn
	}
	if updateData.LookingFor != "" {
		updateMap["looking_for"] = updateData.LookingFor
	}
	if updateData.SexualOrientation != "" {
		updateMap["sexual_orientation"] = updateData.SexualOrientation
	}
	if updateData.Photos != nil { // Check if Photos field was included
		// Here you might want logic to add/remove photos rather than just replacing
		// For simplicity now, we replace. Consider a dedicated photo management endpoint.
		updateMap["photos"] = updateData.Photos
	}
	// Preferences are handled separately, but could be included here if desired
	// if updateData.AgeRange != "" { updateMap["age_range"] = updateData.AgeRange }
	// if updateData.Distance != 0 { updateMap["distance"] = updateData.Distance } // Be careful with 0 value updates
	// if updateData.GenderPreference != "" { updateMap["gender_preference"] = updateData.GenderPreference }
	if updateData.Latitude != 0 { // Check non-zero, adjust if 0 is valid
		updateMap["latitude"] = updateData.Latitude
	}
	if updateData.Longitude != 0 { // Check non-zero, adjust if 0 is valid
		updateMap["longitude"] = updateData.Longitude
	}

	ctxUpdate, cancelUpdate := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelUpdate()
	if err := database.DB.WithContext(ctxUpdate).Model(&user).Updates(updateMap).Error; err != nil {
		respondWithError(c, http.StatusInternalServerError, fmt.Sprintf("Failed to update profile: %v", err))
		return
	}

	logger.Printf("Profile updated successfully for user ID %d", user.ID)
	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// UpdateUserPreferences updates the user's preferences by user_id
// @Summary Update user preferences
// @Description Update the user's age range, distance, and gender preference
// @Tags users
// @Accept json
// @Produce json
// @Param user_id path uint true "User ID"
// @Param preferences body models.UpdatePreferencesRequest true "User Preferences"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /preferences/{user_id} [put]
func UpdateUserPreferences(c *gin.Context) {
	userID := c.Param("user_id")

	// Get the authenticated user's ID from the context
	authenticatedUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Convert the parameter to uint for comparison
	paramUserID, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Retrieve user from database first
	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if the authenticated user is updating their own preferences
	if uint(paramUserID) != authenticatedUserID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: You can only update your own preferences"})
		return
	}

	// Bind JSON to UpdatePreferencesRequest struct
	var preference models.UpdatePreferencesRequest
	if err := c.ShouldBindJSON(&preference); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Input validation
	validationErrors := make(map[string]string)

	// Validate age range format (e.g., "18-30")
	if preference.AgeRange != "" {
		ageRangeParts := strings.Split(preference.AgeRange, "-")
		if len(ageRangeParts) != 2 {
			validationErrors["ageRange"] = "Age range must be in format 'min-max' (e.g., '18-30')"
		} else {
			minAge, minErr := strconv.Atoi(ageRangeParts[0])
			maxAge, maxErr := strconv.Atoi(ageRangeParts[1])

			if minErr != nil || maxErr != nil {
				validationErrors["ageRange"] = "Age range must contain valid numbers"
			} else if minAge < 18 {
				validationErrors["ageRange"] = "Minimum age must be at least 18"
			} else if maxAge > 100 {
				validationErrors["ageRange"] = "Maximum age cannot exceed 100"
			} else if minAge >= maxAge {
				validationErrors["ageRange"] = "Minimum age must be less than maximum age"
			}
		}
	}

	// Validate distance
	if preference.Distance < 0 {
		validationErrors["distance"] = "Distance cannot be negative"
	} else if preference.Distance > 100 {
		validationErrors["distance"] = "Distance cannot exceed 100 miles"
	}

	// Validate gender preference
	validGenders := []string{"Male", "Female", "Non-binary", "All"}
	if preference.GenderPreference != "" {
		isValidGender := false
		for _, gender := range validGenders {
			if preference.GenderPreference == gender {
				isValidGender = true
				break
			}
		}

		if !isValidGender {
			validationErrors["genderPreference"] = "Gender preference must be one of: Male, Female, Non-binary, All"
		}
	}

	// Return validation errors if any
	if len(validationErrors) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"errors": validationErrors})
		return
	}

	user.AgeRange = preference.AgeRange
	user.Distance = preference.Distance
	user.GenderPreference = preference.GenderPreference

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update preferences"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Preferences updated successfully"})
}

// GetMatches retrieves potential matches for a user
// @Summary Get potential matches (TEMPORARILY MODIFIED FOR DEBUGGING - SHOWS ALL USERS)
// @Description Retrieve a list of potential matches based on user preferences (Temporarily shows all users except self and blocked)
// @Tags matchmaking
// @Accept json
// @Produce json
// @Param user_id path uint true "User ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {array} models.User
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /matches/{user_id} [get]
func GetMatches(c *gin.Context) {
	authenticatedUserID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	userID := c.Param("user_id")
	matchedOnly := c.Query("matched") == "true"

	paramUserID, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Check permissions
	if uint(paramUserID) != authenticatedUserID {
		respondWithError(c, http.StatusForbidden, "Access denied")
		return
	}

	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := database.DB.WithContext(ctx).Where("id = ?", paramUserID).First(&user).Error; err != nil {
		respondWithError(c, http.StatusNotFound, "User not found")
		return
	}

	// Pagination parameters
	limit, offset := getPaginationParams(c)

	var matches []models.User

	if matchedOnly {
		// Get users who have mutual matches with the current user using a more efficient query
		subQuery := database.DB.Model(&models.Interaction{}).
			Select("target_id").
			Where("user_id = ? AND matched = true", paramUserID)

		if err := database.DB.WithContext(ctx).Model(&models.User{}).
			Where("id IN (?)", subQuery).
			Limit(limit).Offset(offset).
			Find(&matches).Error; err != nil {
			logger.Printf("Failed to retrieve matched users: %v", err)
			respondWithError(c, http.StatusInternalServerError, "Failed to retrieve matched users")
			return
		}
	} else {
		// Get list of users current user has already interacted with
		var interactedUserIDs []uint
		if err := database.DB.WithContext(ctx).Model(&models.Interaction{}).
			Where("user_id = ?", paramUserID).
			Pluck("target_id", &interactedUserIDs).Error; err != nil {
			logger.Printf("Failed to retrieve interaction history: %v", err)
			respondWithError(c, http.StatusInternalServerError, "Failed to retrieve interaction history")
			return
		}

		// Exclude self, blocked users, and already interacted users
		excludedIDs := append([]uint{authenticatedUserID}, user.BlockedUsers...)
		excludedIDs = append(excludedIDs, interactedUserIDs...)

		// Ensure we have at least one ID to exclude to avoid SQL error
		if len(excludedIDs) == 0 {
			excludedIDs = append(excludedIDs, 0) // Add impossible ID 0
		}

		query := database.DB.WithContext(ctx).Model(&models.User{}).Where("id NOT IN ?", excludedIDs)

		// Apply gender preference filter if specified
		if user.GenderPreference != "" && user.GenderPreference != "All" {
			query = query.Where("gender = ?", user.GenderPreference)
		}

		// Apply age range filter if specified
		if user.AgeRange != "" {
			ageRangeParts := strings.Split(user.AgeRange, "-")
			if len(ageRangeParts) == 2 {
				minAge, minErr := strconv.Atoi(ageRangeParts[0])
				maxAge, maxErr := strconv.Atoi(ageRangeParts[1])

				if minErr == nil && maxErr == nil {
					maxDOB := time.Now().AddDate(-minAge, 0, 0).Format("2006-01-02")
					minDOB := time.Now().AddDate(-maxAge-1, 0, 0).Format("2006-01-02")
					query = query.Where("date_of_birth <= ? AND date_of_birth >= ?", maxDOB, minDOB)
				}
			}
		}

		if err := query.Limit(limit).Offset(offset).Find(&matches).Error; err != nil {
			logger.Printf("Failed to retrieve potential matches: %v", err)
			respondWithError(c, http.StatusInternalServerError, "Failed to retrieve potential matches")
			return
		}
	}

	// Sanitize the response
	var sanitizedMatches []gin.H
	for _, match := range matches {
		sanitizedMatches = append(sanitizedMatches, gin.H{
			"id":                match.ID,
			"firstName":         match.FirstName,
			"dateOfBirth":       match.DateOfBirth,
			"gender":            match.Gender,
			"interests":         match.Interests,
			"lookingFor":        match.LookingFor,
			"profilePictureURL": match.ProfilePictureURL,
			"bio":               match.Bio,
		})
	}

	c.JSON(http.StatusOK, sanitizedMatches)
}

// SendMessage sends a message from one user to another
// @Summary Send a message
// @Description Send a message to another user
// @Tags messaging
// @Accept json
// @Produce json
// @Param message body models.SendMessageRequest true "Message details"
// @Security ApiKeyAuth
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /messages [post]
func SendMessage(c *gin.Context) {
	// Get the authenticated user's ID from the context
	senderID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Bind JSON request
	var req models.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if sender exists
	var sender models.User
	if err := database.DB.Where("id = ?", senderID).First(&sender).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sender not found"})
		return
	}

	// Check if receiver exists
	var receiver models.User
	if err := database.DB.Where("id = ?", req.ReceiverID).First(&receiver).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Receiver not found"})
		return
	}

	// Check if users are matched
	var interaction models.Interaction
	matchExists := database.DB.Where("(user_id = ? AND target_id = ? AND matched = ?) OR (user_id = ? AND target_id = ? AND matched = ?)",
		senderID, req.ReceiverID, true, req.ReceiverID, senderID, true).First(&interaction).Error == nil

	if !matchExists {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only send messages to users you have matched with"})
		return
	}

	// Create and save the message
	message := models.Message{
		SenderID:   senderID.(uint),
		ReceiverID: req.ReceiverID,
		Content:    req.Content,
		Read:       false,
	}

	if err := database.DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":          message.ID,
		"sender_id":   message.SenderID,
		"receiver_id": message.ReceiverID,
		"content":     message.Content,
		"created_at":  message.CreatedAt,
	})
}

// GetMessages retrieves the conversation between the current user and another user
// @Summary Get conversation
// @Description Get all messages between the current user and another user
// @Tags messaging
// @Accept json
// @Produce json
// @Param user_id path uint true "Other user's ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Messages per page" default(20)
// @Security ApiKeyAuth
// @Success 200 {array} models.Message
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /messages/{user_id} [get]
func GetMessages(c *gin.Context) {
	// Get the current user's ID from the context
	currentUserIDAny, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	// Type assertion to uint
	currentUserID, ok := currentUserIDAny.(uint)
	if !ok {
		log.Printf("ERROR: Could not assert currentUserID to uint. Value: %v, Type: %T", currentUserIDAny, currentUserIDAny)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error processing user ID"})
		return
	}

	// Get the other user's ID from the URL parameter
	otherUserIDStr := c.Param("user_id")
	otherUserIDUint64, err := strconv.ParseUint(otherUserIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}
	otherUserIDUint := uint(otherUserIDUint64) // Convert to uint

	log.Printf("GetMessages: Attempting to fetch messages between User %d and User %d", currentUserID, otherUserIDUint)

	// Check if users are matched (Revised Check)
	var interactionCount int64
	query := database.DB.Model(&models.Interaction{}).Where(
		"((user_id = ? AND target_id = ?) OR (user_id = ? AND target_id = ?)) AND matched = ?",
		currentUserID, otherUserIDUint, // User A -> User B
		otherUserIDUint, currentUserID, // User B -> User A
		true, // matched = true
	)

	result := query.Count(&interactionCount)
	if result.Error != nil {
		log.Printf("ERROR: Database error checking match: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking match status"})
		return
	}

	matchExists := interactionCount > 0

	log.Printf("GetMessages: Match check between User %d and User %d. Interaction count: %d, Match exists: %t", currentUserID, otherUserIDUint, interactionCount, matchExists)

	if !matchExists {
		log.Printf("GetMessages: Access Denied. No match found between User %d and User %d.", currentUserID, otherUserIDUint)
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only view messages with users you have matched with"})
		return
	}

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	// Get messages between the two users
	var messages []models.Message
	if err := database.DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		currentUserID, otherUserIDUint, otherUserIDUint, currentUserID,
	).Order("created_at DESC").Limit(limit).Offset(offset).Find(&messages).Error; err != nil {
		log.Printf("ERROR: Failed to retrieve messages for users %d and %d: %v", currentUserID, otherUserIDUint, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}

	// Mark messages as read
	database.DB.Model(&models.Message{}).
		Where("sender_id = ? AND receiver_id = ? AND read = ?", otherUserIDUint, currentUserID, false).
		Updates(map[string]interface{}{"read": true})

	c.JSON(http.StatusOK, messages)
}

// GetConversations retrieves a list of all conversations for the current user
// @Summary Get all conversations
// @Description Get a list of all users the current user has exchanged messages with
// @Tags messaging
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {array} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /conversations [get]
func GetConversations(c *gin.Context) {
	// Get the current user's ID from the context
	currentUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Use a more efficient query to get all unique conversation partners
	type ConversationData struct {
		UserID              uint      `json:"user_id"`
		FirstName           string    `json:"first_name"`
		ProfilePictureURL   string    `json:"profile_picture_url"`
		LastMessageID       uint      `json:"last_message_id"`
		LastMessageContent  string    `json:"last_message_content"`
		LastMessageTime     time.Time `json:"last_message_time"`
		LastMessageSenderID uint      `json:"last_message_sender_id"`
		UnreadCount         int64     `json:"unread_count"`
	}

	var conversations []ConversationData

	// Single optimized query to get all conversation data
	query := `
		WITH conversation_partners AS (
			SELECT DISTINCT 
				CASE 
					WHEN sender_id = ? THEN receiver_id 
					ELSE sender_id 
				END as partner_id
			FROM messages 
			WHERE sender_id = ? OR receiver_id = ?
		),
		last_messages AS (
			SELECT DISTINCT ON (
				CASE 
					WHEN sender_id = ? THEN receiver_id 
					ELSE sender_id 
				END
			)
				CASE 
					WHEN sender_id = ? THEN receiver_id 
					ELSE sender_id 
				END as partner_id,
				id as last_message_id,
				content as last_message_content,
				created_at as last_message_time,
				sender_id as last_message_sender_id
			FROM messages 
			WHERE sender_id = ? OR receiver_id = ?
			ORDER BY 
				CASE 
					WHEN sender_id = ? THEN receiver_id 
					ELSE sender_id 
				END,
				created_at DESC
		),
		unread_counts AS (
			SELECT 
				sender_id as partner_id,
				COUNT(*) as unread_count
			FROM messages 
			WHERE receiver_id = ? AND read = false
			GROUP BY sender_id
		)
		SELECT 
			u.id as user_id,
			u.first_name,
			u.profile_picture_url,
			lm.last_message_id,
			lm.last_message_content,
			lm.last_message_time,
			lm.last_message_sender_id,
			COALESCE(uc.unread_count, 0) as unread_count
		FROM conversation_partners cp
		JOIN users u ON u.id = cp.partner_id
		JOIN last_messages lm ON lm.partner_id = cp.partner_id
		LEFT JOIN unread_counts uc ON uc.partner_id = cp.partner_id
		ORDER BY lm.last_message_time DESC
	`

	if err := database.DB.Raw(query,
		currentUserID, currentUserID, currentUserID, // conversation_partners CTE
		currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, // last_messages CTE
		currentUserID, // unread_counts CTE
	).Scan(&conversations).Error; err != nil {
		logger.Printf("Failed to retrieve conversations for user %v: %v", currentUserID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve conversations"})
		return
	}

	// Format response
	response := make([]map[string]interface{}, len(conversations))
	for i, conv := range conversations {
		response[i] = map[string]interface{}{
			"user": map[string]interface{}{
				"id":                conv.UserID,
				"firstName":         conv.FirstName,
				"profilePictureURL": conv.ProfilePictureURL,
			},
			"lastMessage": map[string]interface{}{
				"id":         conv.LastMessageID,
				"content":    conv.LastMessageContent,
				"created_at": conv.LastMessageTime,
				"sender_id":  conv.LastMessageSenderID,
			},
			"unreadCount": conv.UnreadCount,
		}
	}

	c.JSON(http.StatusOK, response)
}

// LikeUser handles when a user likes another user
// @Summary Like a user
// @Description Record when a user likes another user and check for a match
// @Tags matchmaking
// @Accept json
// @Produce json
// @Param target_id path uint true "Target User ID"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /like/{target_id} [post]
func LikeUser(c *gin.Context) {
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	// Get the target user's ID from the URL parameter
	targetID := c.Param("target_id")
	targetIDUint, err := strconv.ParseUint(targetID, 10, 32)
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid target ID")
		return
	}

	// Check if the target user exists
	var targetUser models.User
	if err := database.DB.Where("id = ?", targetIDUint).First(&targetUser).Error; err != nil {
		respondWithError(c, http.StatusNotFound, "Target user not found")
		return
	}

	// Start a transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Check if an interaction already exists
	var existingInteraction models.Interaction
	interactionExists := tx.Where("user_id = ? AND target_id = ?", userID, targetIDUint).First(&existingInteraction).Error == nil

	if interactionExists {
		tx.Rollback()
		respondWithError(c, http.StatusBadRequest, "You have already interacted with this user")
		return
	}

	// Create the new interaction (like)
	interaction := models.Interaction{
		UserID:    userID,
		TargetID:  uint(targetIDUint),
		Liked:     true,
		Matched:   false,
		CreatedAt: time.Now(),
	}

	// Check if the target user has already liked the current user
	var targetInteraction models.Interaction
	isMatch := tx.Where("user_id = ? AND target_id = ? AND liked = ?", targetIDUint, userID, true).First(&targetInteraction).Error == nil

	if isMatch {
		// It's a match! Update both interactions
		interaction.Matched = true

		if err := tx.Model(&targetInteraction).Update("matched", true).Error; err != nil {
			tx.Rollback()
			logger.Printf("Failed to update target interaction: %v", err)
			respondWithError(c, http.StatusInternalServerError, "Failed to update target interaction")
			return
		}
	}

	// Save the new interaction
	if err := tx.Create(&interaction).Error; err != nil {
		tx.Rollback()
		logger.Printf("Failed to record like: %v", err)
		respondWithError(c, http.StatusInternalServerError, "Failed to record like")
		return
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		logger.Printf("Failed to commit transaction: %v", err)
		respondWithError(c, http.StatusInternalServerError, "Failed to complete operation")
		return
	}

	response := gin.H{
		"success": true,
		"liked":   true,
		"matched": isMatch,
	}

	c.JSON(http.StatusOK, response)
}

// DislikeUser handles when a user dislikes another user
// @Summary Dislike a user
// @Description Record when a user dislikes another user
// @Tags matchmaking
// @Accept json
// @Produce json
// @Param target_id path uint true "Target User ID"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /dislike/{target_id} [post]
func DislikeUser(c *gin.Context) {
	// Get the current user's ID from the context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Get the target user's ID from the URL parameter
	targetID := c.Param("target_id")
	targetIDUint, err := strconv.ParseUint(targetID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID"})
		return
	}

	// Check if the target user exists
	var targetUser models.User
	if err := database.DB.Where("id = ?", targetIDUint).First(&targetUser).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target user not found"})
		return
	}

	// Check if an interaction already exists
	var existingInteraction models.Interaction
	interactionExists := database.DB.Where("user_id = ? AND target_id = ?", userID, targetIDUint).First(&existingInteraction).Error == nil

	if interactionExists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You have already interacted with this user"})
		return
	}

	// Create the new interaction (dislike)
	interaction := models.Interaction{
		UserID:    userID.(uint),
		TargetID:  uint(targetIDUint),
		Liked:     false,
		Matched:   false,
		CreatedAt: time.Now(),
	}

	// Save the new interaction
	if err := database.DB.Create(&interaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record dislike"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"liked":   false,
		"matched": false,
	})
}

// Delete user account
// DeleteUserProfile deletes the authenticated user's account
// @Summary Delete user profile
// @Description Permanently deletes the authenticated user's account
// @Tags users
// @Accept json
// @Produce json
// @Param user_id path uint true "User ID"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /profile/{user_id} [delete]
func DeleteUserProfile(c *gin.Context) {
	userID := c.Param("user_id")

	// Get the authenticated user's ID from the context
	authenticatedUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Convert the parameter to uint for comparison
	paramUserID, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if user exists first
	var user models.User
	if err := database.DB.Where("id = ?", paramUserID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if the authenticated user is deleting their own profile
	if uint(paramUserID) != authenticatedUserID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: You can only delete your own profile"})
		return
	}

	// Delete the user
	if err := database.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile deleted successfully"})
}

// ReportUser allows a user to report another user for inappropriate behavior
// @Summary Report a user
// @Description Submits a report against a target user with a reason
// @Tags matchmaking
// @Accept json
// @Produce json
// @Param target_id path uint true "Target User ID"
// @Param report body models.ReportRequest true "Report details"
// @Security ApiKeyAuth
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /report/{target_id} [post]
func ReportUser(c *gin.Context) {
	targetID := c.Param("target_id")

	// Get the authenticated user's ID from the context
	authenticatedUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Convert the target ID to uint
	targetUserID, err := strconv.ParseUint(targetID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target user ID"})
		return
	}

	// Prevent users from reporting themselves
	if uint(targetUserID) == authenticatedUserID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot report yourself"})
		return
	}

	// Bind and validate the report request
	var reportReq models.ReportRequest
	if err := c.ShouldBindJSON(&reportReq); err != nil {
		var validationErrs validator.ValidationErrors
		if errors.As(err, &validationErrs) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Reason is required"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Check if the target user exists
	var targetUser models.User
	if err := database.DB.Where("id = ?", targetUserID).First(&targetUser).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target user not found"})
		return
	}

	// Create the report
	report := models.Report{
		ReporterID: authenticatedUserID.(uint),
		TargetID:   uint(targetUserID),
		Reason:     reportReq.Reason,
	}

	if err := database.DB.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit report"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Report submitted successfully"})
}

// BlockUser allows a user to block another user
// @Summary Block a user
// @Description Blocks a target user, preventing further interaction or visibility
// @Tags matchmaking
// @Accept json
// @Produce json
// @Param target_id path uint true "Target User ID"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /block/{target_id} [post]
func BlockUser(c *gin.Context) {
	targetID := c.Param("target_id")

	// Get the authenticated user's ID from the context
	authenticatedUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Convert the target ID to uint
	targetUserID, err := strconv.ParseUint(targetID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target user ID"})
		return
	}

	// Prevent users from blocking themselves
	if uint(targetUserID) == authenticatedUserID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot block yourself"})
		return
	}

	// Check if the target user exists
	var targetUser models.User
	if err := database.DB.Where("id = ?", targetUserID).First(&targetUser).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target user not found"})
		return
	}

	// Retrieve the authenticated user
	var user models.User
	if err := database.DB.Where("id = ?", authenticatedUserID).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}

	// Check if the target is already blocked
	for _, blockedID := range user.BlockedUsers {
		if blockedID == uint(targetUserID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User is already blocked"})
			return
		}
	}

	// Add the target user to the blocked list
	user.BlockedUsers = append(user.BlockedUsers, uint(targetUserID))

	// Save the updated user
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to block user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User blocked successfully"})
}

// UnblockUser removes a user from the authenticated user's blocked list
// @Summary Unblock a user
// @Description Removes a target user from the authenticated user's blocked list
// @Tags matchmaking
// @Produce json
// @Param target_id path uint true "Target User ID"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /block/{target_id} [delete]
func UnblockUser(c *gin.Context) {
	targetID := c.Param("target_id")

	// Get the authenticated user's ID from the context
	authenticatedUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Convert the target ID to uint
	targetUserID, err := strconv.ParseUint(targetID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target user ID"})
		return
	}

	// Prevent unblocking self (though it’s unlikely to be an issue, added for consistency)
	if uint(targetUserID) == authenticatedUserID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot unblock yourself"})
		return
	}

	// Check if the target user exists
	var targetUser models.User
	if err := database.DB.Where("id = ?", targetUserID).First(&targetUser).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target user not found"})
		return
	}

	// Retrieve the authenticated user
	var user models.User
	if err := database.DB.Where("id = ?", authenticatedUserID).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}

	// Check if the target is in the blocked list
	blockedIndex := -1
	for i, blockedID := range user.BlockedUsers {
		if blockedID == uint(targetUserID) {
			blockedIndex = i
			break
		}
	}

	if blockedIndex == -1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is not blocked"})
		return
	}

	// Remove the target user from the blocked list
	user.BlockedUsers = append(user.BlockedUsers[:blockedIndex], user.BlockedUsers[blockedIndex+1:]...)

	// Save the updated user
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unblock user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User unblocked successfully"})
}

// UnmatchUser removes the match relationship between two users
// @Summary Unmatch a user
// @Description Allows a user to unmatch another user they were previously matched with
// @Tags matchmaking
// @Security ApiKeyAuth
// @Param user_id path uint true "Target user ID to unmatch"
// @Produce json
// @Success 200 {object} map[string]string "Unmatched successfully"
// @Failure 400 {object} map[string]string "Invalid input"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Router /unmatch/{user_id} [post]
func UnmatchUser(c *gin.Context) {
	currentUserID := c.GetInt("userID")

	targetIDStr := c.Param("user_id")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Update 'matched' status to false in both directions
	database.DB.Model(&models.Interaction{}).
		Where("user_id = ? AND target_id = ?", currentUserID, targetID).
		Update("matched", false)

	database.DB.Model(&models.Interaction{}).
		Where("user_id = ? AND target_id = ?", targetID, currentUserID).
		Update("matched", false)

	c.JSON(http.StatusOK, gin.H{"message": "Unmatched successfully"})
}
