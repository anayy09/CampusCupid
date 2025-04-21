package main

import (
	"datingapp/database"
	"datingapp/handlers"
	"datingapp/models"
	"datingapp/storage"
	"log"
	"os"
	"time"

	_ "datingapp/docs" // Import Swagger docs
	"datingapp/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// host for local development: @host localhost:8080
// host for production: @host campuscupid.onrender.com

// @title CampusCupid API
// @version 1.0
// @description This is the backend API for the CampusCupid dating app.
// @termsOfService http://swagger.io/terms/
// @contact.name API Support
// @contact.email support@campuscupid.com
// @license.name MIT
// @license.url https://opensource.org/licenses/MIT
// @host campuscupid.onrender.com
// @BasePath /
func main() {
	// Initialize database connection
	database.Connect()

	// Migrate the Message model
	database.DB.AutoMigrate(&models.Message{})

	// Create a new Gin router with default middleware (logging, recovery)
	r := gin.Default()

	// Configure CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Allow all origins (tighten in production)
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour, // Cache preflight requests for 12 hours
	}))

	// Serve Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Initialize Cloudinary
	if err := storage.InitCloudinary(); err != nil {
		log.Fatalf("Failed to initialize Cloudinary: %v", err)
	}
	// LOGIN APIS
	// Public authentication routes
	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)
	// Public route for uploading photos during registration (no auth required)
	r.POST("/public/upload/photos", handlers.PublicUploadPhotos) // For registration without auth
	// Protected routes for photo management (auth required)
	r.POST("/upload/photos", middleware.AuthMiddleware(), handlers.UploadPhotos)
	r.DELETE("/upload/photos", middleware.AuthMiddleware(), handlers.DeletePhoto)

	// USER PROFILE APIS - Protected with authentication middleware
	// get profile info
	r.GET("/profile/:user_id", middleware.AuthMiddleware(), handlers.GetUserProfile)
	// update profile info
	r.PUT("/profile/:user_id", middleware.AuthMiddleware(), handlers.UpdateUserProfile)
	// update user preferences
	r.PUT("/preferences/:user_id", middleware.AuthMiddleware(), handlers.UpdateUserPreferences)
	//Delete user account
	r.DELETE("/profile/:user_id", middleware.AuthMiddleware(), handlers.DeleteUserProfile) // New route

	// MATCHMAKING APIS
	// get all users for matching
	r.GET("/matches/:user_id", middleware.AuthMiddleware(), handlers.GetMatches)
	// like a user
	r.POST("/like/:target_id", middleware.AuthMiddleware(), handlers.LikeUser)
	// dislike a user
	r.POST("/dislike/:target_id", middleware.AuthMiddleware(), handlers.DislikeUser)
	//Report user
	r.POST("/report/:target_id", middleware.AuthMiddleware(), handlers.ReportUser) // New route
	// Block user
	r.POST("/block/:target_id", middleware.AuthMiddleware(), handlers.BlockUser) // New route
	// unblock user
	r.DELETE("/block/:target_id", middleware.AuthMiddleware(), handlers.UnblockUser) // New route

	// MESSAGING APIS
	// Send a message to another user
	r.POST("/messages", middleware.AuthMiddleware(), handlers.SendMessage)
	// Get conversation with a specific user
	r.GET("/messages/:user_id", middleware.AuthMiddleware(), handlers.GetMessages)
	// Get all conversations
	r.GET("/conversations", middleware.AuthMiddleware(), handlers.GetConversations)

	// new routes
	// USER ACTIVITY LOG
	r.GET("/activity-log", middleware.AuthMiddleware(), handlers.GetActivityLog)

	// ADMIN REPORT VIEWER
	// r.GET("/reports", middleware.AuthMiddleware(), handlers.GetAllReports)

	// UNMATCH A USER
	// r.POST("/unmatch/:user_id", middleware.AuthMiddleware(), handlers.UnmatchUser)

	// Determine the port to run on (default to 8080 if not set)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start the server
	log.Printf("Server is running on port %s", port)
	r.Run(":" + port) // Listen on 0.0.0.0:port
}
