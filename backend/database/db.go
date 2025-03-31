package database

import (
	"datingapp/logger"
	"datingapp/models"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// DB is a global variable holding the database connection
var DB *gorm.DB

// Connect establishes a connection to the PostgreSQL database
func Connect() {
	// Build the database connection string (DSN) using environment variables
	err := godotenv.Load()
	if err != nil {
		logger.Warn("Error loading .env file: %v. Will attempt to use environment variables directly.", err)
	}

	// Check if required environment variables are set
	requiredEnvVars := []string{"DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_PORT"}
	for _, envVar := range requiredEnvVars {
		if os.Getenv(envVar) == "" {
			logger.Fatal("Required environment variable %s is not set", envVar)
		}
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	// Set up connection pool configuration
	maxIdleConns := 10               // Default value
	maxOpenConns := 100              // Default value
	connMaxLifetime := 1 * time.Hour // Default value

	// Try to parse custom connection pool settings from environment variables
	if os.Getenv("DB_MAX_IDLE_CONNS") != "" {
		if val, err := strconv.Atoi(os.Getenv("DB_MAX_IDLE_CONNS")); err == nil {
			maxIdleConns = val
			logger.Info("Using custom DB_MAX_IDLE_CONNS: %d", maxIdleConns)
		}
	}

	if os.Getenv("DB_MAX_OPEN_CONNS") != "" {
		if val, err := strconv.Atoi(os.Getenv("DB_MAX_OPEN_CONNS")); err == nil {
			maxOpenConns = val
			logger.Info("Using custom DB_MAX_OPEN_CONNS: %d", maxOpenConns)
		}
	}

	if os.Getenv("DB_CONN_MAX_LIFETIME") != "" {
		if val, err := strconv.Atoi(os.Getenv("DB_CONN_MAX_LIFETIME")); err == nil {
			connMaxLifetime = time.Duration(val) * time.Minute
			logger.Info("Using custom DB_CONN_MAX_LIFETIME: %d minutes", val)
		}
	}

	// Configure GORM logger based on environment
	logLevel := gormlogger.Silent
	if os.Getenv("DEBUG") == "true" {
		logLevel = gormlogger.Info
	}

	// Attempt to open the database connection using GORM with custom configuration
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(logLevel),
	})

	if err != nil {
		logger.Fatal("Failed to connect to database: %v", err)
	}

	// Configure connection pooling
	sqlDB, err := DB.DB()
	if err != nil {
		logger.Fatal("Failed to get database connection: %v", err)
	}

	// SetMaxIdleConns sets the maximum number of connections in the idle connection pool
	sqlDB.SetMaxIdleConns(maxIdleConns)

	// SetMaxOpenConns sets the maximum number of open connections to the database
	sqlDB.SetMaxOpenConns(maxOpenConns)

	// SetConnMaxLifetime sets the maximum amount of time a connection may be reused
	sqlDB.SetConnMaxLifetime(connMaxLifetime)

	// Log connection pool settings
	logger.Info("Database connection pool configured: maxIdleConns=%d, maxOpenConns=%d, connMaxLifetime=%v",
		maxIdleConns, maxOpenConns, connMaxLifetime)

	// Print a success message if connection is established
	logger.Info("Database connection established")

	// Auto-migrate models to ensure schema is up-to-date
	// Migrates User (with new geolocation fields) and Interaction tables
	// Auto-migrate models to ensure schema is up-to-date
	if err := DB.AutoMigrate(&models.User{}, &models.Interaction{}, &models.Message{}, &models.Report{}); err != nil {
		panic("Failed to auto-migrate database")
	}

	// Print a success message if migration is completed successfully
	logger.Info("Database migration completed")
}
