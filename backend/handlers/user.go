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
func Register(c *gin.Context) {
	var req models.RegistrationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		FirstName:         req.FirstName,
		Email:             req.Email,
		Password:          req.Password,
		DateOfBirth:       req.DateOfBirth,
		Gender:            req.Gender,
		InterestedIn:      req.InterestedIn,
		LookingFor:        req.LookingFor,
		Interests:         req.Interests,
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
		"user_id": fmt.Sprintf("%d", user.ID),
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
func GetUserProfile(c *gin.Context) {
	userID := c.Param("user_id")

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
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
		"latitude":          user.Latitude,  // Added
		"longitude":         user.Longitude, // Added
	})
}

// UpdateUserProfile updates the profile details of the user by user_id
func UpdateUserProfile(c *gin.Context) {
	userID := c.Param("user_id")

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var updateData models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user.Interests = updateData.Interests
	user.ProfilePictureURL = updateData.ProfilePictureURL
	user.FirstName = updateData.FirstName
	user.DateOfBirth = updateData.DateOfBirth
	user.Gender = updateData.Gender
	user.InterestedIn = updateData.InterestedIn
	user.LookingFor = updateData.LookingFor
	user.SexualOrientation = updateData.SexualOrientation
	user.Photos = updateData.Photos
	user.AgeRange = updateData.AgeRange
	user.Distance = updateData.Distance
	user.GenderPreference = updateData.GenderPreference
	user.Latitude = updateData.Latitude   // Added
	user.Longitude = updateData.Longitude // Added

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// UpdateUserPreferences updates the user's preferences by user_id
func UpdateUserPreferences(c *gin.Context) {
	userID := c.Param("user_id")

	var preference models.UpdatePreferencesRequest
	if err := c.ShouldBindJSON(&preference); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
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
// @Summary Get potential matches
// @Description Retrieve a list of potential matches based on user preferences
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
	// Extract user_id from path
	userID := c.Param("user_id")
	userIDUint, err := strconv.ParseUint(userID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Fetch the current user
	var user models.User
	if err := database.DB.Where("id = ?", userIDUint).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Parse age range (e.g., "18-25")
	var minAge, maxAge int
	if user.AgeRange != "" {
		ages := strings.Split(user.AgeRange, "-")
		if len(ages) == 2 {
			minAge, _ = strconv.Atoi(ages[0])
			maxAge, _ = strconv.Atoi(ages[1])
		}
	}

	// Calculate date range for age filtering
	now := time.Now()
	minDOB := now.AddDate(-maxAge-1, 0, 0).Format("2006-01-02")
	maxDOB := now.AddDate(-minAge, 0, 0).Format("2006-01-02")

	// Get users already interacted with (liked, disliked, or matched)
	var interactions []models.Interaction
	database.DB.Where("user_id = ?", userIDUint).Find(&interactions)
	excludeIDs := []uint{uint(userIDUint)} // Exclude self
	for _, i := range interactions {
		excludeIDs = append(excludeIDs, i.TargetID)
	}

	// Build the query for potential matches
	var matches []models.User
	query := database.DB.Model(&models.User{}).
		Where("id NOT IN ?", excludeIDs).
		Where("gender = ?", user.GenderPreference)

	// Apply age range filter if specified
	if minAge > 0 && maxAge > 0 {
		query = query.Where("date_of_birth BETWEEN ? AND ?", minDOB, maxDOB)
	}

	// Apply distance filter if geolocation is available
	if user.Latitude != 0 && user.Longitude != 0 && user.Distance > 0 {
		query = query.Where(`
			6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
			cos(radians(longitude) - radians(?)) + 
			sin(radians(?)) * sin(radians(latitude))) <= ?`,
			user.Latitude, user.Longitude, user.Latitude, user.Distance)
	}

	// Execute query with pagination
	if err := query.Limit(limit).Offset(offset).Find(&matches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch matches"})
		return
	}

	// Strip sensitive data (e.g., Password)
	for i := range matches {
		matches[i].Password = ""
	}

	c.JSON(http.StatusOK, matches)
}
