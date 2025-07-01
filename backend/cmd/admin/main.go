package main

import (
	"datingapp/database"
	"datingapp/models"
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run cmd/admin/main.go <action> <email>")
		fmt.Println("Actions: make-admin, remove-admin")
		fmt.Println("Example: go run cmd/admin/main.go make-admin admin@gmail.com")
		os.Exit(1)
	}

	action := os.Args[1]
	email := os.Args[2]

	// Connect to database
	database.Connect()

	switch action {
	case "make-admin":
		if err := makeUserAdmin(email); err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}
	case "remove-admin":
		if err := removeUserAdmin(email); err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}
	default:
		fmt.Printf("Unknown action: %s\n", action)
		fmt.Println("Valid actions: make-admin, remove-admin")
		os.Exit(1)
	}
}

// makeUserAdmin sets a user as admin by email
func makeUserAdmin(email string) error {
	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return fmt.Errorf("user with email %s not found: %v", email, err)
	}

	if err := database.DB.Model(&user).Update("is_admin", true).Error; err != nil {
		return fmt.Errorf("failed to update user admin status: %v", err)
	}

	fmt.Printf("✅ User %s (ID: %d) has been granted admin privileges\n", email, user.ID)
	return nil
}

// removeUserAdmin removes admin privileges from a user by email
func removeUserAdmin(email string) error {
	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		return fmt.Errorf("user with email %s not found: %v", email, err)
	}

	if err := database.DB.Model(&user).Update("is_admin", false).Error; err != nil {
		return fmt.Errorf("failed to update user admin status: %v", err)
	}

	fmt.Printf("✅ Admin privileges removed from user %s (ID: %d)\n", email, user.ID)
	return nil
}
