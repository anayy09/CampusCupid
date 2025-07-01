package handlers

import (
	"datingapp/database"
	"datingapp/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// GetUserSettings retrieves user settings
// @Summary Get user settings
// @Description Get user notification and privacy settings
// @Tags settings
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} map[string]interface{} "User settings"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "User not found"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /settings [get]
func GetUserSettings(c *gin.Context) {
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		respondWithError(c, http.StatusNotFound, "User not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"notificationSettings": user.NotificationSettings,
		"privacySettings":      user.PrivacySettings,
		"city":                 user.City,
		"country":              user.Country,
		"phone":                user.Phone,
		"lastActiveAt":         user.LastActiveAt,
		"isOnline":             user.IsOnline,
	})
}

// UpdateUserSettings updates user settings
// @Summary Update user settings
// @Description Update user notification and privacy settings
// @Tags settings
// @Accept json
// @Produce json
// @Param settings body models.UpdateSettingsRequest true "Settings to update"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string "Settings updated successfully"
// @Failure 400 {object} map[string]string "Bad Request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "User not found"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /settings [put]
func UpdateUserSettings(c *gin.Context) {
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	var request models.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid request format")
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		respondWithError(c, http.StatusNotFound, "User not found")
		return
	}

	// Update fields that were provided
	updateMap := make(map[string]interface{})

	if request.NotificationSettings != nil {
		updateMap["notification_settings"] = request.NotificationSettings
	}

	if request.PrivacySettings != nil {
		updateMap["privacy_settings"] = request.PrivacySettings
	}

	if request.City != "" {
		updateMap["city"] = request.City
	}

	if request.Country != "" {
		updateMap["country"] = request.Country
	}

	if request.Phone != "" {
		updateMap["phone"] = request.Phone
	}

	if len(updateMap) > 0 {
		if err := database.DB.Model(&user).Updates(updateMap).Error; err != nil {
			respondWithError(c, http.StatusInternalServerError, "Failed to update settings")
			return
		}
	}

	logger.Printf("Settings updated for user ID %d", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Settings updated successfully"})
}

// UpdateUserOnlineStatus updates user's online status and last active time
// @Summary Update online status
// @Description Update user's online status and last active timestamp
// @Tags settings
// @Accept json
// @Produce json
// @Param status body map[string]bool true "Online status"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string "Status updated successfully"
// @Failure 400 {object} map[string]string "Bad Request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "User not found"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /status [put]
func UpdateUserOnlineStatus(c *gin.Context) {
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	var request struct {
		IsOnline bool `json:"isOnline"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid request format")
		return
	}

	now := time.Now()
	updateMap := map[string]interface{}{
		"is_online":      request.IsOnline,
		"last_active_at": &now,
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updateMap).Error; err != nil {
		respondWithError(c, http.StatusInternalServerError, "Failed to update online status")
		return
	}

	logger.Printf("Online status updated for user ID %d: %v", userID, request.IsOnline)
	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

// IncrementProfileViews increments the profile view count for a user
// @Summary Increment profile views
// @Description Increment the profile view count when someone views a user's profile
// @Tags settings
// @Accept json
// @Produce json
// @Param user_id path uint true "User ID whose profile was viewed"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string "Profile view recorded"
// @Failure 400 {object} map[string]string "Bad Request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "User not found"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /profile/{user_id}/view [post]
func IncrementProfileViews(c *gin.Context) {
	viewerID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	targetUserID := c.Param("user_id")
	if targetUserID == "" {
		respondWithError(c, http.StatusBadRequest, "User ID required")
		return
	}

	// Don't count self-views
	if targetUserID == string(rune(viewerID)) {
		c.JSON(http.StatusOK, gin.H{"message": "Self-view not counted"})
		return
	}

	// Increment profile views
	if err := database.DB.Model(&models.User{}).Where("id = ?", targetUserID).
		Update("profile_views", database.DB.Raw("profile_views + 1")).Error; err != nil {
		respondWithError(c, http.StatusInternalServerError, "Failed to update profile views")
		return
	}

	logger.Printf("Profile view recorded: User %d viewed User %s", viewerID, targetUserID)
	c.JSON(http.StatusOK, gin.H{"message": "Profile view recorded"})
}
