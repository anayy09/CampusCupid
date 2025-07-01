package handlers

import (
	"datingapp/database"
	"datingapp/models"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetNotifications retrieves notifications for the authenticated user
// @Summary Get user notifications
// @Description Get paginated notifications for the authenticated user
// @Tags notifications
// @Accept json
// @Produce json
// @Param limit query int false "Number of notifications per page" default(20)
// @Param offset query int false "Number of notifications to skip" default(0)
// @Param unread_only query bool false "Get only unread notifications" default(false)
// @Security ApiKeyAuth
// @Success 200 {object} models.GetNotificationsResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /notifications [get]
func GetNotifications(c *gin.Context) {
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	unreadOnlyStr := c.DefaultQuery("unread_only", "false")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100 // Maximum limit
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	unreadOnly := unreadOnlyStr == "true"

	// Build query
	query := database.DB.Where("user_id = ?", userID)
	if unreadOnly {
		query = query.Where("read = ?", false)
	}

	// Get total count
	var totalCount int64
	query.Model(&models.Notification{}).Count(&totalCount)

	// Get unread count
	var unreadCount int64
	database.DB.Model(&models.Notification{}).Where("user_id = ? AND read = ?", userID, false).Count(&unreadCount)

	// Get notifications with fromUser data
	var notifications []models.Notification
	err = query.Preload("FromUser").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&notifications).Error

	if err != nil {
		logger.Printf("Failed to fetch notifications: %v", err)
		respondWithError(c, http.StatusInternalServerError, "Failed to fetch notifications")
		return
	}

	// Convert to response format
	var notificationResponses []models.NotificationResponse
	for _, notification := range notifications {
		response := models.NotificationResponse{
			ID:        notification.ID,
			Type:      notification.Type,
			Title:     notification.Title,
			Message:   notification.Message,
			Data:      notification.Data,
			Read:      notification.Read,
			CreatedAt: notification.CreatedAt,
		}

		if notification.FromUser != nil {
			response.FromUser = &models.UserBasicInfo{
				ID:                notification.FromUser.ID,
				FirstName:         notification.FromUser.FirstName,
				ProfilePictureURL: notification.FromUser.ProfilePictureURL,
			}
		}

		notificationResponses = append(notificationResponses, response)
	}

	response := models.GetNotificationsResponse{
		Notifications: notificationResponses,
		UnreadCount:   unreadCount,
		TotalCount:    totalCount,
	}

	c.JSON(http.StatusOK, response)
}

// MarkNotificationsRead marks specified notifications as read
// @Summary Mark notifications as read
// @Description Mark one or more notifications as read for the authenticated user
// @Tags notifications
// @Accept json
// @Produce json
// @Param request body models.MarkNotificationReadRequest true "Notification IDs to mark as read"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /notifications/read [put]
func MarkNotificationsRead(c *gin.Context) {
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	var req models.MarkNotificationReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid request format")
		return
	}

	if len(req.NotificationIDs) == 0 {
		respondWithError(c, http.StatusBadRequest, "No notification IDs provided")
		return
	}

	// Update notifications to read status
	err := database.DB.Model(&models.Notification{}).
		Where("id IN ? AND user_id = ?", req.NotificationIDs, userID).
		Update("read", true).Error

	if err != nil {
		logger.Printf("Failed to mark notifications as read: %v", err)
		respondWithError(c, http.StatusInternalServerError, "Failed to update notifications")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notifications marked as read"})
}

// MarkAllNotificationsRead marks all notifications as read for the authenticated user
// @Summary Mark all notifications as read
// @Description Mark all notifications as read for the authenticated user
// @Tags notifications
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /notifications/read-all [put]
func MarkAllNotificationsRead(c *gin.Context) {
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	err := database.DB.Model(&models.Notification{}).
		Where("user_id = ?", userID).
		Update("read", true).Error

	if err != nil {
		logger.Printf("Failed to mark all notifications as read: %v", err)
		respondWithError(c, http.StatusInternalServerError, "Failed to update notifications")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// GetNotificationCount gets the unread notification count for the authenticated user
// @Summary Get unread notification count
// @Description Get the count of unread notifications for the authenticated user
// @Tags notifications
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} map[string]int64
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /notifications/count [get]
func GetNotificationCount(c *gin.Context) {
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	var unreadCount int64
	err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Count(&unreadCount).Error

	if err != nil {
		logger.Printf("Failed to get notification count: %v", err)
		respondWithError(c, http.StatusInternalServerError, "Failed to get notification count")
		return
	}

	c.JSON(http.StatusOK, gin.H{"unreadCount": unreadCount})
}

// CreateNotification creates a new notification (internal function)
func CreateNotification(userID uint, fromUserID *uint, notificationType models.NotificationType, title, message, data string) error {
	notification := models.Notification{
		UserID:     userID,
		FromUserID: fromUserID,
		Type:       notificationType,
		Title:      title,
		Message:    message,
		Data:       data,
		Read:       false,
	}

	err := database.DB.Create(&notification).Error
	if err != nil {
		logger.Printf("Failed to create notification: %v", err)
		return fmt.Errorf("failed to create notification: %v", err)
	}

	// TODO: Send real-time notification via WebSocket here
	logger.Printf("Notification created for user %d: %s", userID, title)

	return nil
}

// Helper function to create match notification
func CreateMatchNotification(userID, matchedUserID uint, matchedUserName string) error {
	title := "New Match! 💕"
	message := fmt.Sprintf("You matched with %s! Start chatting now.", matchedUserName)
	data := fmt.Sprintf(`{"matchedUserId": %d, "action": "view_match"}`, matchedUserID)

	return CreateNotification(userID, &matchedUserID, models.NotificationTypeMatch, title, message, data)
}

// Helper function to create message notification
func CreateMessageNotification(receiverID, senderID uint, senderName, messagePreview string) error {
	title := "New Message 💬"
	message := fmt.Sprintf("%s sent you a message", senderName)
	if len(messagePreview) > 50 {
		messagePreview = messagePreview[:50] + "..."
	}
	data := fmt.Sprintf(`{"senderId": %d, "messagePreview": "%s", "action": "view_chat"}`, senderID, messagePreview)

	return CreateNotification(receiverID, &senderID, models.NotificationTypeMessage, title, message, data)
}

// Helper function to create like notification
func CreateLikeNotification(likedUserID, likerUserID uint, likerName string) error {
	title := "Someone Liked You! ❤️"
	message := fmt.Sprintf("%s liked your profile", likerName)
	data := fmt.Sprintf(`{"likerId": %d, "action": "view_profile"}`, likerUserID)

	return CreateNotification(likedUserID, &likerUserID, models.NotificationTypeLike, title, message, data)
}
