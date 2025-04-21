package handlers

import (
	"datingapp/database"
	"datingapp/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetAllReports returns all submitted user reports (admin only)
// @Summary View all user reports (Admin)
// @Description Admin-only endpoint to list all submitted reports
// @Tags admin
// @Security ApiKeyAuth
// @Produce json
// @Success 200 {array} models.Report
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 403 {object} map[string]string "Forbidden - Admin only"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /reports [get]
func GetAllReports(c *gin.Context) {
	isAdmin := c.GetBool("isAdmin")
	if !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var reports []models.Report
	if err := database.DB.Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve reports"})
		return
	}

	c.JSON(http.StatusOK, reports)
}
