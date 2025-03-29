package database

import (
	"datingapp/models"
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DB is a global variable holding the database connection
var DB *gorm.DB

// Connect establishes a connection to the PostgreSQL database
func Connect() {
	// Construct the Data Source Name (DSN) using environment variables
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),     // Database host
		os.Getenv("DB_USER"),     // Database user
		os.Getenv("DB_PASSWORD"), // Database password
		os.Getenv("DB_NAME"),     // Database name
		os.Getenv("DB_PORT"),     // Database port
	)

	// Attempt to connect to the database
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database") // Panic on connection failure
	}

	fmt.Println("Database connection established")

	// Auto-migrate models to ensure schema is up-to-date
	// Migrates User (with new geolocation fields) and Interaction tables
	if err := DB.AutoMigrate(&models.User{}, &models.Interaction{}); err != nil {
		panic("Failed to auto-migrate database")
	}

	fmt.Println("Database migration completed")
}
