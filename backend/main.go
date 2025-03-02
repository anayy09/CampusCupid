package main

// go run main.go
// swag init
// go mod tidy
//swag init --parseDependency --parseInternal

import (
	"log"
	"time"

	"datingapp/database"
	"datingapp/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "datingapp/docs"
)

func init() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
}

// @title CampusCupid API
// @version 1.0
// @description This is the backend API for the CampusCupid dating app.
// @termsOfService http://swagger.io/terms/
// @contact.name API Support
// @contact.email support@campuscupid.com
// @license.name MIT
// @license.url https://opensource.org/licenses/MIT
// @host localhost:8080
// @BasePath /
func main() {
	// Initialize database connection
	database.Connect()

	// Create a new Gin router instance
	r := gin.Default()

	// CORS middleware configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Allow all origins, change this if needed
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Swagger documentation route
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// LOGIN APIS
	// Public authentication routes
	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)

	// USER PROFILE APIS
	// get profile info
	r.GET("/profile/:user_id", handlers.GetUserProfile)
	// update profile info
	r.PUT("/profile/:user_id", handlers.UpdateUserProfile)
	// update user preferences
	r.PUT("/preferences/:user_id", handlers.UpdateUserPreferences)

	// APIS ON MATCHMAING PAGE

	// API FOR MESSAGING

	// Start the server on port 8080
	r.Run(":8080")
}
