package handlers

import (
	"datingapp/storage"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const maxUploadSize = 5 * 1024 * 1024 // 5 MB

// UploadPhoto handles single photo upload (for EditProfile compatibility)
// @Summary Upload single photo
// @Description Upload a single photo (used by EditProfile page)
// @Tags uploads
// @Accept multipart/form-data
// @Produce json
// @Param photo formData file true "Photo to upload"
// @Security ApiKeyAuth
// @Success 200 {object} map[string]string{url=string} "URL of uploaded photo"
// @Failure 400 {object} map[string]string "Bad Request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /upload [post]
func UploadPhoto(c *gin.Context) {
	// Get authenticated user ID for folder organization
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	file, err := c.FormFile("photo")
	if err != nil {
		respondWithError(c, http.StatusBadRequest, "No photo file provided")
		return
	}

	// Validate file size
	if file.Size > maxUploadSize {
		respondWithError(c, http.StatusBadRequest, fmt.Sprintf("File %s is too large (max %d MB)", file.Filename, maxUploadSize/1024/1024))
		return
	}

	// Validate file type
	contentType := file.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		respondWithError(c, http.StatusBadRequest, fmt.Sprintf("Invalid file type for %s: only images allowed", file.Filename))
		return
	}

	folder := fmt.Sprintf("dating_app/user_%d", userID) // Organize by user ID

	// Upload to Cloudinary
	url, err := storage.UploadImage(file, folder)
	if err != nil {
		logger.Printf("Failed to upload image to Cloudinary: %v", err)
		respondWithError(c, http.StatusInternalServerError, "Failed to upload image")
		return
	}

	logger.Printf("Uploaded file: %s, URL: %s", file.Filename, url)

	c.JSON(http.StatusOK, gin.H{
		"message": "Photo uploaded successfully",
		"url":     url,
	})
}

// UploadPhotos handles multipart form file uploads to Cloudinary
// @Summary Upload photos
// @Description Uploads one or more photos for a user profile to Cloudinary
// @Tags uploads
// @Accept multipart/form-data
// @Produce json
// @Param photos formData file true "Photos to upload (multiple allowed)"
// @Success 200 {object} map[string][]string{urls=string} "URLs of uploaded photos"
// @Failure 400 {object} map[string]string "Bad Request (e.g., no files, file too large, invalid type)"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /upload/photos [post]
func UploadPhotos(c *gin.Context) {
	// Get authenticated user ID for folder organization
	userID, ok := getAuthenticatedUserID(c)
	if !ok {
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		respondWithError(c, http.StatusBadRequest, fmt.Sprintf("Error parsing multipart form: %v", err))
		return
	}

	files := form.File["photos"] // "photos" should match the form field name from the frontend

	if len(files) == 0 {
		respondWithError(c, http.StatusBadRequest, "No files uploaded")
		return
	}

	var uploadedUrls []string
	folder := fmt.Sprintf("dating_app/user_%d", userID) // Organize by user ID

	for _, file := range files {
		// Validate file size
		if file.Size > maxUploadSize {
			respondWithError(c, http.StatusBadRequest, fmt.Sprintf("File %s is too large (max %d MB)", file.Filename, maxUploadSize/1024/1024))
			return
		}

		// Validate file type
		contentType := file.Header.Get("Content-Type")
		if !strings.HasPrefix(contentType, "image/") {
			respondWithError(c, http.StatusBadRequest, fmt.Sprintf("Invalid file type for %s: only images allowed", file.Filename))
			return
		}

		// Upload to Cloudinary
		url, err := storage.UploadImage(file, folder)
		if err != nil {
			logger.Printf("Failed to upload image to Cloudinary: %v", err)
			respondWithError(c, http.StatusInternalServerError, "Failed to upload image")
			return
		}

		uploadedUrls = append(uploadedUrls, url)
		logger.Printf("Uploaded file: %s, URL: %s", file.Filename, url)
	}

	c.JSON(http.StatusOK, gin.H{"urls": uploadedUrls})
}

// DeletePhoto deletes a photo from Cloudinary
// @Summary Delete photo
// @Description Deletes a photo from Cloudinary by URL
// @Tags uploads
// @Accept json
// @Produce json
// @Param request body map[string]string{url=string} true "URL of the photo to delete"
// @Success 200 {object} map[string]string "Success message"
// @Failure 400 {object} map[string]string "Bad Request"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /upload/photos [delete]
func DeletePhoto(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		respondWithError(c, http.StatusBadRequest, "Invalid request format")
		return
	}

	// Extract public ID from URL
	publicID := storage.ExtractPublicIDFromURL(req.URL)
	if publicID == "" {
		respondWithError(c, http.StatusBadRequest, "Invalid Cloudinary URL")
		return
	}

	// Delete from Cloudinary
	if err := storage.DeleteImage(publicID); err != nil {
		logger.Printf("Failed to delete image from Cloudinary: %v", err)
		respondWithError(c, http.StatusInternalServerError, "Failed to delete image")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Photo deleted successfully"})
}
