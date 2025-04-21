package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type ActivityEntry struct {
	Event     string    `json:"event"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

func GetActivityLog(c *gin.Context) {
	// Mocked activity log; replace with actual DB queries if needed
	userID := c.GetInt("userID")

	logs := []ActivityEntry{
		{"like", "You liked user #42", time.Now().Add(-2 * time.Hour)},
		{"match", "Matched with user #37", time.Now().Add(-90 * time.Minute)},
		{"profile_update", "Updated your bio", time.Now().Add(-1 * time.Hour)},
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":    userID,
		"activities": logs,
	})
}
