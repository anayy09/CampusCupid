package handlers

import (
	"datingapp/database"
	"datingapp/models"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Register handles user registration
// @Summary Register a new user
// @Description Create a new user account
// @Tags users
// @Accept json
// @Produce json
// @Param user body models.RegistrationRequest true "User registration details"
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /register [post]
func Register(c *gin.Context) {
	var req models.RegistrationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// if req.Password != req.ConfirmPassword {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": "password and confirm password do not match"})
	// 	return
	// }

	user := models.User{
		FirstName:    req.FirstName,
		Email:        req.Email,
		Password:     req.Password,
		DateOfBirth:  req.DateOfBirth,
		Gender:       req.Gender,
		InterestedIn: req.InterestedIn,
		LookingFor:   req.LookingFor,
		Interests:    req.Interests,
		// Bio:               req.Bio,
		SexualOrientation: req.SexualOrientation,
		Photos:            req.Photos,
	}

	if err := user.HashPassword(user.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not hash password"})
		return
	}

	if err := database.DB.Create(&user).Error; err != nil {
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create user"})
		return
	}

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
// @Router /login [post]
func Login(c *gin.Context) {
	var input models.LoginRequest

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := user.CheckPassword(input.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": fmt.Sprintf("%d", user.ID), // Store as string
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
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
	// Extract user_id from URL
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

	// Check if the authenticated user is accessing their own profile
	if uint(paramUserID) != authenticatedUserID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: You can only view your own profile"})
		return
	}

	// Retrieve the user info from the database
	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Return the user's profile details
	c.JSON(http.StatusOK, gin.H{
		"id":           user.ID,
		"firstName":    user.FirstName,
		"email":        user.Email,
		"dateOfBirth":  user.DateOfBirth,
		"gender":       user.Gender,
		"interestedIn": user.InterestedIn,
		"lookingFor":   user.LookingFor,
		"interests":    user.Interests,
		// "bio":               user.Bio,
		"sexualOrientation": user.SexualOrientation,
		"photos":            user.Photos,
		"ageRange":          user.AgeRange,
		"distance":          user.Distance,
		"genderPreference":  user.GenderPreference,
		"profilePictureURL": user.ProfilePictureURL,
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
	// Extract user_id from URL
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

	// Check if the authenticated user is updating their own profile
	if uint(paramUserID) != authenticatedUserID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: You can only update your own profile"})
		return
	}

	// Retrieve user from database
	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Bind request body to update struct
	var updateData models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Input validation
	validationErrors := make(map[string]string)

	// Validate firstName if provided
	if updateData.FirstName != "" && len(updateData.FirstName) < 2 {
		validationErrors["firstName"] = "First name must be at least 2 characters"
	}

	// Validate dateOfBirth if provided
	if updateData.DateOfBirth != "" {
		_, err := time.Parse("2006-01-02", updateData.DateOfBirth)
		if err != nil {
			validationErrors["dateOfBirth"] = "Date of birth must be in format YYYY-MM-DD"
		}
	}

	// Validate interests if provided
	if updateData.Interests != nil && len(updateData.Interests) == 0 {
		validationErrors["interests"] = "Interests cannot be empty if provided"
	}

	// Validate Photos if provided
	if updateData.Photos != nil && len(updateData.Photos) == 0 {
		validationErrors["photos"] = "Photos cannot be empty if provided"
	}

	// Return validation errors if any
	if len(validationErrors) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"errors": validationErrors})
		return
	}

	// Update allowed fields
	// user.Bio = updateData.Bio

	// Only update fields that are provided (not empty)
	if updateData.Interests != nil {
		user.Interests = updateData.Interests
	}
	if updateData.ProfilePictureURL != "" {
		user.ProfilePictureURL = updateData.ProfilePictureURL
	}
	if updateData.FirstName != "" {
		user.FirstName = updateData.FirstName
	}
	if updateData.DateOfBirth != "" {
		user.DateOfBirth = updateData.DateOfBirth
	}
	if updateData.Gender != "" {
		user.Gender = updateData.Gender
	}
	if updateData.InterestedIn != "" {
		user.InterestedIn = updateData.InterestedIn
	}
	if updateData.LookingFor != "" {
		user.LookingFor = updateData.LookingFor
	}
	if updateData.SexualOrientation != "" {
		user.SexualOrientation = updateData.SexualOrientation
	}
	if updateData.Photos != nil {
		user.Photos = updateData.Photos
	}
	if updateData.AgeRange != "" {
		user.AgeRange = updateData.AgeRange
	}
	if updateData.Distance != 0 {
		user.Distance = updateData.Distance
	}
	if updateData.GenderPreference != "" {
		user.GenderPreference = updateData.GenderPreference
	}

	// Save changes to database
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update profile"})
		return
	}

	// Return success message
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
	// Extract user_id from URL
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

	// Retrieve user from database
	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update user preferences
	user.AgeRange = preference.AgeRange
	user.Distance = preference.Distance
	user.GenderPreference = preference.GenderPreference

	// Save changes to the database
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update preferences"})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{"message": "Preferences updated successfully"})
}

// Matchmaking Page api's
