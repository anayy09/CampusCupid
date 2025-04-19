package handlers

import (
	"datingapp/storage"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// PublicUploadPhotos handles public multipart form file uploads to Cloudinary
// Used specifically for registration where no authentication is available yet
// @Summary Upload photos without authentication
// @Description Uploads photos to Cloudinary without requiring authentication (for registration)
// @Tags uploads
// @Accept multipart/form-data
// @Produce json
// @Param photos formData file true "Photos to upload (multiple allowed)"
// @Success 200 {object} map[string][]string{urls=string} "URLs of uploaded photos"
// @Failure 400 {object} map[string]string "Bad Request (e.g., no files, file too large, invalid type)"
// @Failure 500 {object} map[string]string "Internal Server Error"
// @Router /public/upload/photos [post]
func PublicUploadPhotos(c *gin.Context) {
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
	folder := "dating_app/registration" // Photos will be organized in a temporary folder until user is registered

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
