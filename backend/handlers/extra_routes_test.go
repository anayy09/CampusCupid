package handlers

import (
	"bytes"
	"datingapp/middleware"
	"datingapp/models"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// Helper to set up router with new routes
func setupExtraRoutes(r *gin.Engine) {
	authorized := r.Group("/")
	authorized.Use(middleware.AuthMiddleware())
	{
		authorized.GET("/activity-log", GetActivityLog)
		authorized.GET("/reports", GetAllReports)
		authorized.POST("/unmatch/:user_id", UnmatchUser)
	}
}

func TestActivityLog(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)
	setupExtraRoutes(router)

	// Register a test user
	user := models.User{FirstName: "Test", Email: "test@a.com", Password: "123456"}
	user.HashPassword(user.Password)
	db.Create(&user)

	req, _ := http.NewRequest("GET", "/activity-log", nil)
	addAuthHeader(req, user.ID)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"event":"like"`)

	writeTestResult("/activity-log", TestResult{
		TestName: "Basic Activity Log",
		Status:   http.StatusText(w.Code),
		Response: w.Body.String(),
	})
}

func TestAdminReportAccess(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)
	setupExtraRoutes(router)

	// Create admin user
	admin := models.User{FirstName: "Admin", Email: "admin@a.com", Password: "admin"}
	admin.HashPassword(admin.Password)
	db.Create(&admin)

	// Create a report
	report := models.Report{ReporterID: 1, TargetID: 2, Reason: "test reason"}
	db.Create(&report)

	req, _ := http.NewRequest("GET", "/reports", nil)
	addAuthHeader(req, admin.ID)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"reason":"test reason"`)

	writeTestResult("/reports", TestResult{
		TestName: "Admin Can View Reports",
		Status:   http.StatusText(w.Code),
		Response: w.Body.String(),
	})
}

func TestUnmatchUser(t *testing.T) {
	db := setupTestDB()
	router := setupRouter(db)
	setupExtraRoutes(router)

	// Create users
	user1 := models.User{FirstName: "A", Email: "a@a.com", Password: "pass"}
	user2 := models.User{FirstName: "B", Email: "b@b.com", Password: "pass"}
	user1.HashPassword(user1.Password)
	user2.HashPassword(user2.Password)
	db.Create(&user1)
	db.Create(&user2)

	// Create mutual match
	match1 := models.Interaction{UserID: user1.ID, TargetID: user2.ID, Matched: true}
	match2 := models.Interaction{UserID: user2.ID, TargetID: user1.ID, Matched: true}
	db.Create(&match1)
	db.Create(&match2)

	req, _ := http.NewRequest("POST", "/unmatch/"+strconv.Itoa(int(user2.ID)), bytes.NewBuffer([]byte{}))
	addAuthHeader(req, user1.ID)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Unmatched successfully")

	writeTestResult("/unmatch/:user_id", TestResult{
		TestName: "Unmatch Another User",
		Status:   http.StatusText(w.Code),
		Response: w.Body.String(),
	})
}
