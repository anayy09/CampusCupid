package database

// Import necessary packages
import (
	"datingapp/models" // Import the models package for User model
	"fmt"              // For formatted I/O
	"log"              // For logging errors
	"os"               // For working with environment variables

	"github.com/joho/godotenv" // For loading environment variables from .env file
	"gorm.io/driver/postgres"  // GORM PostgreSQL driver
	"gorm.io/gorm"             // GORM ORM library
)

var DB *gorm.DB // Global variable to hold the database connection

// Connect function to establish a connection to the PostgreSQL database
func Connect() {
	// Build the database connection string (DSN) using environment variables
	err := godotenv.Load()
	if err != nil {
		log.Printf("Error loading .env file: %v. Will attempt to use environment variables directly.", err)
		// Don't panic, try to continue with environment variables that might be set outside .env
	}

	// Check if required environment variables are set
	requiredEnvVars := []string{"DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT"}
	for _, envVar := range requiredEnvVars {
		if os.Getenv(envVar) == "" {
			log.Fatalf("ERROR: Required environment variable %s is not set", envVar)
			// Fatal will exit the application with a non-zero code instead of panic
		}
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", // Format the DSN for connecting to PostgreSQL
		os.Getenv("DB_HOST"),     // Get DB host from environment variable
		os.Getenv("DB_USER"),     // Get DB user from environment variable
		os.Getenv("DB_PASSWORD"), // Get DB password from environment variable
		os.Getenv("DB_NAME"),     // Get DB name from environment variable
		os.Getenv("DB_PORT"),     // Get DB port from environment variable
	)

	// Variable to capture potential error during database connection
	// Attempt to open the database connection using GORM
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	// If connection fails, log the error and exit
	if err != nil {
		log.Fatalf("ERROR: Failed to connect to database: %v", err)
		// Fatal will exit the application with a non-zero code instead of panic
	}

	// Print a success message if connection is established
	log.Println("Database connection established")

	// Auto-migrate the User model to ensure the schema is up-to-date in the database
	// This will create the tables, columns, and constraints based on the User model
	if err := DB.AutoMigrate(&models.User{}); err != nil {
		// If migration fails, log the error and exit
		log.Fatalf("ERROR: Failed to auto-migrate database: %v", err)
		// Fatal will exit the application with a non-zero code instead of panic
	}

	// Print a success message if migration is completed successfully
	log.Println("Database migration completed")
}
