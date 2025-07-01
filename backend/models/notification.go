package models

import (
	"time"

	"gorm.io/gorm"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeMatch   NotificationType = "match"
	NotificationTypeMessage NotificationType = "message"
	NotificationTypeLike    NotificationType = "like"
	NotificationTypeView    NotificationType = "profile_view"
)

// Notification represents a user notification
type Notification struct {
	ID         uint             `gorm:"primaryKey" json:"id"`
	UserID     uint             `gorm:"not null;index" json:"userId"`      // User receiving the notification
	FromUserID *uint            `gorm:"index" json:"fromUserId,omitempty"` // User who triggered the notification (optional)
	Type       NotificationType `gorm:"not null" json:"type"`
	Title      string           `gorm:"not null" json:"title"`
	Message    string           `gorm:"not null" json:"message"`
	Data       string           `gorm:"type:json" json:"data,omitempty"` // Additional data as JSON
	Read       bool             `gorm:"default:false" json:"read"`
	CreatedAt  time.Time        `json:"createdAt"`
	UpdatedAt  time.Time        `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt   `gorm:"index" json:"-"`

	// Relationships
	User     User  `gorm:"foreignKey:UserID" json:"-"`
	FromUser *User `gorm:"foreignKey:FromUserID" json:"fromUser,omitempty"`
}

// CreateNotificationRequest represents the request to create a notification
type CreateNotificationRequest struct {
	UserID     uint             `json:"userId" binding:"required"`
	FromUserID *uint            `json:"fromUserId,omitempty"`
	Type       NotificationType `json:"type" binding:"required"`
	Title      string           `json:"title" binding:"required"`
	Message    string           `json:"message" binding:"required"`
	Data       string           `json:"data,omitempty"`
}

// MarkNotificationReadRequest represents the request to mark notifications as read
type MarkNotificationReadRequest struct {
	NotificationIDs []uint `json:"notificationIds" binding:"required"`
}

// NotificationResponse represents the response format for notifications
type NotificationResponse struct {
	ID        uint             `json:"id"`
	Type      NotificationType `json:"type"`
	Title     string           `json:"title"`
	Message   string           `json:"message"`
	Data      string           `json:"data,omitempty"`
	Read      bool             `json:"read"`
	CreatedAt time.Time        `json:"createdAt"`
	FromUser  *UserBasicInfo   `json:"fromUser,omitempty"`
}

// UserBasicInfo represents basic user info for notifications
type UserBasicInfo struct {
	ID                uint   `json:"id"`
	FirstName         string `json:"firstName"`
	ProfilePictureURL string `json:"profilePictureUrl,omitempty"`
}

// GetNotificationsResponse represents the response for getting notifications
type GetNotificationsResponse struct {
	Notifications []NotificationResponse `json:"notifications"`
	UnreadCount   int64                  `json:"unreadCount"`
	TotalCount    int64                  `json:"totalCount"`
}
