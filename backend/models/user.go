package models

import (
	"time" // For timestamp fields

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the dating app
type User struct {
	ID                uint       `gorm:"primaryKey" json:"id"`                       // Primary key for the user
	CreatedAt         time.Time  `json:"created_at"`                                 // Timestamp of creation
	UpdatedAt         time.Time  `json:"updated_at"`                                 // Timestamp of last update
	DeletedAt         *time.Time `gorm:"index" json:"deleted_at"`                    // Soft delete timestamp (nullable, pointer for nil value)
	FirstName         string     `gorm:"not null" json:"firstName"`                  // User's first name, required
	Email             string     `gorm:"unique;not null" json:"email"`               // Unique email, required
	Password          string     `gorm:"not null" json:"-"`                          // Hashed password, excluded from JSON
	DateOfBirth       string     `gorm:"not null" json:"dateOfBirth"`                // Date of birth in YYYY-MM-DD format, required
	Gender            string     `gorm:"not null" json:"gender"`                     // User's gender, required
	InterestedIn      string     `gorm:"not null" json:"interestedIn"`               // What the user is interested in (e.g., "dating", "friendship"), required
	LookingFor        string     `gorm:"not null" json:"lookingFor"`                 // What the user is looking for (e.g., "relationship"), required
	Interests         []string   `gorm:"type:json;serializer:json" json:"interests"` // List of user interests, stored as JSON
	Bio               string     `gorm:"type:text" json:"bio"`                       // Optional user bio
	SexualOrientation string     `json:"sexualOrientation"`                          // Optional sexual orientation
	Photos            []string   `gorm:"type:json;serializer:json" json:"photos"`    // List of photo URLs, stored as JSON
	AgeRange          string     `gorm:"type:varchar(50)" json:"ageRange"`           // Preferred age range (e.g., "18-25")
	Distance          int        `gorm:"type:int" json:"distance"`                   // Preferred match distance in kilometers
	GenderPreference  string     `gorm:"type:varchar(50)" json:"genderPreference"`   // Preferred gender for matches
	ProfilePictureURL string     `gorm:"type:text" json:"profilePictureURL"`         // URL of the user's profile picture
	Latitude          float64    `gorm:"type:double precision" json:"latitude"`      // User's latitude for geolocation
	Longitude         float64    `gorm:"type:double precision" json:"longitude"`     // User's longitude for geolocation
}

// Interaction tracks user interactions (likes, dislikes, matches)
type Interaction struct {
	UserID    uint      `gorm:"primaryKey" json:"user_id"`   // ID of the user performing the action
	TargetID  uint      `gorm:"primaryKey" json:"target_id"` // ID of the target user
	Liked     bool      `json:"liked"`                       // True if liked, False if disliked
	Matched   bool      `json:"matched"`                     // True if mutual like (match)
	CreatedAt time.Time `json:"created_at"`                  // Timestamp of the interaction
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
