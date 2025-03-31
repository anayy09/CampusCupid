package logger

import (
	"fmt"
	"log"
	"os"
	"runtime"
	"time"
)

// Logger instances for different log levels, each with a specific prefix and output
var (
	// infoLogger logs informational messages, useful for general application status updates
	infoLogger *log.Logger
	// warningLogger logs warning messages, indicating potential issues that aren't critical
	warningLogger *log.Logger
	// errorLogger logs error messages, capturing issues that need attention or debugging
	errorLogger *log.Logger
	// debugLogger logs debug messages, enabled only when DEBUG env var is "true" for detailed tracing
	debugLogger *log.Logger
)

// init initializes the logging system when the package is loaded
func init() {
	// Attempt to create or open the log file "app.log" in append mode with read/write permissions
	logFile, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		// If opening the file fails (e.g., due to permissions), fall back to stderr
		fmt.Printf("Error opening log file: %v, using stderr instead\n", err)
		// Configure loggers to output to stderr with prefixes and timestamp flags
		infoLogger = log.New(os.Stderr, "INFO: ", log.Ldate|log.Ltime)
		warningLogger = log.New(os.Stderr, "WARNING: ", log.Ldate|log.Ltime)
		errorLogger = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime)
		debugLogger = log.New(os.Stderr, "DEBUG: ", log.Ldate|log.Ltime)
		return // Exit init to avoid further setup with a failed file
	}

	// If file opens successfully, configure loggers to write to app.log
	// Each logger includes a prefix (e.g., "INFO: ") and timestamps (date and time)
	infoLogger = log.New(logFile, "INFO: ", log.Ldate|log.Ltime)
	warningLogger = log.New(logFile, "WARNING: ", log.Ldate|log.Ltime)
	errorLogger = log.New(logFile, "ERROR: ", log.Ldate|log.Ltime)
	debugLogger = log.New(logFile, "DEBUG: ", log.Ldate|log.Ltime)
}

// getCallerInfo retrieves the file name and line number of the calling function
// This helps identify where in the code the log message originates
func getCallerInfo() string {
	// runtime.Caller(2) skips two stack frames: getCallerInfo and the logger function itself
	_, file, line, ok := runtime.Caller(2)
	if !ok {
		// Return a default string if caller info can't be retrieved
		return "unknown:0"
	}
	// Extract the short file name (e.g., "main.go" from "/path/to/main.go")
	short := file
	for i := len(file) - 1; i > 0; i-- {
		if file[i] == '/' {
			short = file[i+1:]
			break
		}
	}
	// Format as "filename:line" for concise caller identification
	return fmt.Sprintf("%s:%d", short, line)
}

// Info logs an informational message to track normal application flow or events
func Info(format string, v ...interface{}) {
	// Format the message with provided arguments
	msg := fmt.Sprintf(format, v...)
	// Get the caller's file and line number
	caller := getCallerInfo()
	// Log with RFC3339 timestamp, caller info, and the message
	infoLogger.Printf("%s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
}

// Warn logs a warning message for non-critical issues that may need review
func Warn(format string, v ...interface{}) {
	// Format the warning message
	msg := fmt.Sprintf(format, v...)
	// Identify the calling location
	caller := getCallerInfo()
	// Log with timestamp, caller, and message to highlight potential problems
	warningLogger.Printf("%s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
}

// Error logs an error message for issues requiring attention or debugging
func Error(format string, v ...interface{}) {
	// Format the error message with arguments
	msg := fmt.Sprintf(format, v...)
	// Retrieve caller information for traceability
	caller := getCallerInfo()
	// Log with timestamp, caller, and message to document the error
	errorLogger.Printf("%s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
}

// Debug logs a debug message for detailed diagnostics, controlled by the DEBUG env var
func Debug(format string, v ...interface{}) {
	// Check if debugging is enabled via the DEBUG environment variable
	if os.Getenv("DEBUG") != "true" {
		return // Silently skip logging if DEBUG isn't "true"
	}

	// Format the debug message
	msg := fmt.Sprintf(format, v...)
	// Get the caller's location for debugging context
	caller := getCallerInfo()
	// Log with timestamp, caller, and message for in-depth tracing
	debugLogger.Printf("%s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
}

// Fatal logs a critical error message and terminates the application
func Fatal(format string, v ...interface{}) {
	// Format the fatal error message
	msg := fmt.Sprintf(format, v...)
	// Get the caller's file and line for the critical issue
	caller := getCallerInfo()
	// Log with "FATAL" prefix, timestamp, caller, and message to indicate severity
	errorLogger.Printf("FATAL: %s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
	// Exit the application with a non-zero status code to signal failure
	os.Exit(1)
}
