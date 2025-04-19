package models

import (
	"time"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user in the dating app
// User represents a user in the dating app
type User struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
	FirstName         string         `gorm:"not null" json:"firstName"`
	Email             string         `gorm:"unique;not null" json:"email"`
	Password          string         `gorm:"not null" json:"-"`
	DateOfBirth       string         `gorm:"not null" json:"dateOfBirth"`
	Gender            string         `gorm:"not null" json:"gender"`
	InterestedIn      string         `gorm:"not null" json:"interestedIn"`
	LookingFor        string         `gorm:"not null" json:"lookingFor"`
	Interests         []string       `gorm:"type:json;serializer:json" json:"interests"`
	Bio               string         `gorm:"type:text" json:"bio"`
	SexualOrientation string         `json:"sexualOrientation"`
	Photos            []string       `gorm:"type:json;serializer:json" json:"photos"`
	AgeRange          string         `gorm:"type:varchar(50)" json:"ageRange"`
	Distance          int            `gorm:"type:int" json:"distance"`
	GenderPreference  string         `gorm:"type:varchar(50)" json:"genderPreference"`
	ProfilePictureURL string         `gorm:"type:text" json:"profilePictureURL"`
	Latitude          float64        `gorm:"type:float" json:"latitude"`
	Longitude         float64        `gorm:"type:float" json:"longitude"`
	BlockedUsers      []uint         `gorm:"type:json;serializer:json" json:"blockedUsers"` // New field for blocked user IDs
}

// Interaction tracks user interactions (likes, dislikes, matches)
type Interaction struct {
	UserID    uint      `gorm:"primaryKey" json:"user_id"`   // ID of the user performing the action
	TargetID  uint      `gorm:"primaryKey" json:"target_id"` // ID of the target user
	Liked     bool      `json:"liked"`                       // True if liked, False if disliked
	Matched   bool      `json:"matched"`                     // True if mutual like (match)
	CreatedAt time.Time `json:"created_at"`                  // Timestamp of the interaction
}

// Message represents a chat message between users
type Message struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	SenderID   uint           `gorm:"not null" json:"sender_id"`   // ID of the user sending the message
	ReceiverID uint           `gorm:"not null" json:"receiver_id"` // ID of the user receiving the message
	Content    string         `gorm:"type:text;not null" json:"content"`
	Read       bool           `gorm:"default:false" json:"read"` // Whether the message has been read
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

// SendMessageRequest defines the structure for sending a message
type SendMessageRequest struct {
	ReceiverID uint   `json:"receiver_id" binding:"required"`
	Content    string `json:"content" binding:"required,min=1,max=500"`
}

// validatePhotos ensures at least one photo is provided
func validatePhotos(fl validator.FieldLevel) bool {
	return len(fl.Field().Interface().([]string)) > 0
}

// init registers custom validation rules
func init() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("minphotos", validatePhotos)
	}
}

// RegistrationRequest defines the structure for user registration data
type RegistrationRequest struct {
	FirstName         string   `json:"firstName" binding:"required"`
	Email             string   `json:"email" binding:"required,email"`
	Password          string   `json:"password" binding:"required,min=8"`
	DateOfBirth       string   `json:"dateOfBirth" binding:"required"`
	Gender            string   `json:"gender" binding:"required"`
	InterestedIn      string   `json:"interestedIn" binding:"required"`
	LookingFor        string   `json:"lookingFor" binding:"required"`
	Interests         []string `json:"interests" binding:"required"`
	SexualOrientation string   `json:"sexualOrientation"`
	Photos            []string `json:"photos" binding:"required,minphotos"`
	ProfilePictureURL string   `json:"profilePictureURL"`
	Latitude          float64  `json:"latitude"`
	Longitude         float64  `json:"longitude"`
}

// LoginRequest defines the structure for user login data
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UpdateProfileRequest defines fields that can be updated in a user profile
type UpdateProfileRequest struct {
	Interests         []string `json:"interests"`
	ProfilePictureURL string   `json:"profilePictureURL"`
	FirstName         string   `json:"firstName"`
	DateOfBirth       string   `json:"dateOfBirth"`
	Gender            string   `json:"gender"`
	InterestedIn      string   `json:"interestedIn"`
	LookingFor        string   `json:"lookingFor"`
	SexualOrientation string   `json:"sexualOrientation"`
	Photos            []string `json:"photos"`
	AgeRange          string   `json:"ageRange"`
	Distance          int      `json:"distance"`
	GenderPreference  string   `json:"genderPreference"`
	Latitude          float64  `json:"latitude"`
	Longitude         float64  `json:"longitude"`
}

// UpdatePreferencesRequest defines fields for updating user preferences
type UpdatePreferencesRequest struct {
	AgeRange         string `json:"ageRange"`
	Distance         int    `json:"distance"`
	GenderPreference string `json:"genderPreference"`
}

// HashPassword hashes the user's password using bcrypt
func (u *User) HashPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14) // Cost factor of 14
	if err != nil {
		return err
	}
	u.Password = string(bytes)
	return nil
}

// CheckPassword verifies the provided password against the stored hash
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// Report represents a user report for inappropriate behavior
type Report struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	ReporterID uint      `gorm:"not null" json:"reporterId"`       // The user submitting the report
	TargetID   uint      `gorm:"not null" json:"targetId"`         // The user being reported
	Reason     string    `gorm:"type:text;not null" json:"reason"` // Why the report was made
}

// ReportRequest defines the structure for a report submission
type ReportRequest struct {
	Reason string `json:"reason" binding:"required"` // Required field for the report reason
}
