package models

import (
	"time"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	// gorm.Model
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
}

// Custom validation function
func validatePhotos(fl validator.FieldLevel) bool {
	return len(fl.Field().Interface().([]string)) > 0
}

// Register the validation
func init() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("minphotos", validatePhotos)
	}
}

type RegistrationRequest struct {
	FirstName string `json:"firstName" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	// ConfirmPassword   string   `json:"confirmPassword" binding:"required"`
	DateOfBirth  string   `json:"dateOfBirth" binding:"required"`
	Gender       string   `json:"gender" binding:"required"`
	InterestedIn string   `json:"interestedIn" binding:"required"`
	LookingFor   string   `json:"lookingFor" binding:"required"`
	Interests    []string `json:"interests" binding:"required"`
	// Bio               string   `json:"bio"`
	SexualOrientation string   `json:"sexualOrientation"`
	Photos            []string `json:"photos" binding:"required,minphotos"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (u *User) HashPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		return err
	}
	u.Password = string(bytes)
	return nil
}

func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// UpdateProfileRequest defines the fields that can be updated in the user profile
type UpdateProfileRequest struct {
	// Bio               string   `json:"bio"`
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
}

// UpdatePreferencesRequest defines the fields that can be updated in the user preferences
type UpdatePreferencesRequest struct {
	AgeRange         string `json:"ageRange"`
	Distance         int    `json:"distance"`
	GenderPreference string `json:"genderPreference"`
}

// // UpdateProfileRequest is used to update user profile details (bio and interests)
// type UpdateProfileRequest struct {
// 	Bio               string `json:"bio"`
// 	Interests         string `json:"interests"`
// 	ProfilePictureURL string `json:"profile_picture"`
// 	AgeRange          string `json:"age_range"`
// 	Distance          int    `json:"distance"`
// 	GenderPreference  string `json:"gender_preference"`
// }

// // UpdatePreferencesRequest is used to update user preferences like age range, distance, and gender preference
// type UpdatePreferencesRequest struct {
// 	AgeRange         string `json:"age_range"`         // Age range preference
// 	Distance         int    `json:"distance"`          // Distance preference
// 	GenderPreference string `json:"gender_preference"` // Gender preference for matches
// }

// // HashPassword hashes the provided password using bcrypt and stores it in the User struct
// func (u *User) HashPassword(password string) error {
// 	// Generate a bcrypt hash of the password with a cost of 14
// 	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
// 	if err != nil {
// 		return err // Return an error if password hashing fails
// 	}
// 	u.Password = string(bytes) // Store the hashed password in the User struct
// 	return nil                 // Return nil if hashing is successful
// }

// // CheckPassword compares the provided password with the stored hashed password
// func (u *User) CheckPassword(password string) error {
// 	// Compare the hashed password in the User struct with the provided password
// 	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
// }
