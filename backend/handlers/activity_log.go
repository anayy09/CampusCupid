package handlers

import (
	"datingapp/database"
	"datingapp/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetActivityLog returns recent user activity from the database
// @Summary Get user activity log
// @Description Returns a list of recent user actions like likes, matches, profile updates.
// @Tags users
// @Security ApiKeyAuth
// @Produce json
// @Success 200 {object} map[string]interface{} "Activity list"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Router /activity-log [get]
func GetActivityLog(c *gin.Context) {
	userID := c.GetInt("userID")

	var activities []models.ActivityLog
	// Get the last 50 activities for this user, ordered by most recent
	if err := database.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(50).
		Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve activity log"})
		return
	}

	// Convert to the expected format for frontend compatibility
	logs := make([]map[string]interface{}, len(activities))
	for i, activity := range activities {
		logs[i] = map[string]interface{}{
			"event":     activity.Event,
			"message":   activity.Message,
			"timestamp": activity.CreatedAt,
			"targetId":  activity.TargetID,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":    userID,
		"activities": logs,
	})
}
