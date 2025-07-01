package utils

import (
	"datingapp/database"
	"datingapp/models"
	"fmt"
)

// MakeUserAdmin sets a user as admin by email
func MakeUserAdmin(email string) error {
	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return fmt.Errorf("user with email %s not found: %v", email, err)
	}

	if err := database.DB.Model(&user).Update("is_admin", true).Error; err != nil {
		return fmt.Errorf("failed to update user admin status: %v", err)
	}

	fmt.Printf("User %s (ID: %d) has been granted admin privileges\n", email, user.ID)
	return nil
}

// RemoveUserAdmin removes admin privileges from a user by email
func RemoveUserAdmin(email string) error {
	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return fmt.Errorf("user with email %s not found: %v", email, err)
	}

	if err := database.DB.Model(&user).Update("is_admin", false).Error; err != nil {
		return fmt.Errorf("failed to update user admin status: %v", err)
	}

	fmt.Printf("Admin privileges removed from user %s (ID: %d)\n", email, user.ID)
	return nil
}
