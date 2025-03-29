package middleware

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if JWT_SECRET is set
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			fmt.Println("ERROR: JWT_SECRET environment variable is not set")
			c.JSON(500, gin.H{"error": "Internal server configuration error"})
			c.Abort()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == "" {
			c.JSON(401, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			c.JSON(401, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(401, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Extract user_id as string and convert to uint
		userIDStr, ok := claims["user_id"].(string)
		if !ok {
			c.JSON(401, gin.H{"error": "Invalid user ID in token"})
			c.Abort()
			return
		}

		userID, err := strconv.ParseUint(userIDStr, 10, 64)
		if err != nil {
			c.JSON(401, gin.H{"error": "Invalid user ID format"})
			c.Abort()
			return
		}

		c.Set("userID", uint(userID))
		c.Next()
	}
}
