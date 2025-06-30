package storage

import (
	"context"
	"errors"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

var (
	cld    *cloudinary.Cloudinary
	logger = log.New(os.Stdout, "[STORAGE] ", log.LstdFlags)
)

// InitCloudinary initializes the Cloudinary client
func InitCloudinary() error {
	cloudinaryURL := os.Getenv("CLOUDINARY_URL")
	if cloudinaryURL == "" {
		return logger.Output(2, "Cloudinary environment variable CLOUDINARY_URL not set")
	}

	var err error
	cld, err = cloudinary.NewFromURL(cloudinaryURL)
	if err != nil {
		return err
	}

	logger.Println("Cloudinary initialized successfully")
	return nil
}

// UploadImage uploads an image to Cloudinary
func UploadImage(file *multipart.FileHeader, folder string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Open the file
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// Ensure 'cld' is initialized before using it
	if cld == nil {
		return "", errors.New("cloudinary client is not initialized")
	}

	// Upload to Cloudinary
	uploadParams := uploader.UploadParams{
		Folder: folder,
	}

	uploadResult, err := cld.Upload.Upload(ctx, src, uploadParams)
	if err != nil {
		return "", err
	}

	return uploadResult.SecureURL, nil
}

// DeleteImage deletes an image from Cloudinary by public ID
func DeleteImage(publicID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	return err
}

// ExtractPublicIDFromURL extracts the public ID from a Cloudinary URL
func ExtractPublicIDFromURL(url string) string {
	// Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/filename.jpg
	// Public ID: folder/filename

	// This is a simple implementation and might need adjustments based on your actual URLs
	parts := strings.Split(url, "/upload/")
	if len(parts) < 2 {
		return ""
	}

	// Remove version number if present and file extension
	versionAndFile := strings.Split(parts[1], "/")
	if len(versionAndFile) < 2 {
		return ""
	}

	// Remove the version part (v1234567890)
	filePath := strings.Join(versionAndFile[1:], "/")

	// Remove file extension
	extension := filepath.Ext(filePath)
	publicID := filePath[:len(filePath)-len(extension)]

	return publicID
}
