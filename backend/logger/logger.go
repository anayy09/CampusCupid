package logger

import (
	"fmt"
	"log"
	"os"
	"runtime"
	"time"
)

var (
	// Logger instances for different log levels
	infoLogger    *log.Logger
	warningLogger *log.Logger
	errorLogger   *log.Logger
	debugLogger   *log.Logger
)

// Initialize the loggers
func init() {
	// Create or open log file with append mode
	logFile, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		// If we can't open the log file, use standard error output
		fmt.Printf("Error opening log file: %v, using stderr instead\n", err)
		infoLogger = log.New(os.Stderr, "INFO: ", log.Ldate|log.Ltime)
		warningLogger = log.New(os.Stderr, "WARNING: ", log.Ldate|log.Ltime)
		errorLogger = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime)
		debugLogger = log.New(os.Stderr, "DEBUG: ", log.Ldate|log.Ltime)
		return
	}

	// Initialize loggers with appropriate prefixes and flags
	infoLogger = log.New(logFile, "INFO: ", log.Ldate|log.Ltime)
	warningLogger = log.New(logFile, "WARNING: ", log.Ldate|log.Ltime)
	errorLogger = log.New(logFile, "ERROR: ", log.Ldate|log.Ltime)
	debugLogger = log.New(logFile, "DEBUG: ", log.Ldate|log.Ltime)
}

// getCallerInfo returns the file name and line number of the caller
func getCallerInfo() string {
	_, file, line, ok := runtime.Caller(2) // Skip getCallerInfo and the logger function
	if !ok {
		return "unknown:0"
	}
	short := file
	for i := len(file) - 1; i > 0; i-- {
		if file[i] == '/' {
			short = file[i+1:]
			break
		}
	}
	return fmt.Sprintf("%s:%d", short, line)
}

// Info logs an informational message
func Info(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	caller := getCallerInfo()
	infoLogger.Printf("%s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
}

// Warn logs a warning message
func Warn(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	caller := getCallerInfo()
	warningLogger.Printf("%s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
}

// Error logs an error message
func Error(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	caller := getCallerInfo()
	errorLogger.Printf("%s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
}

// Debug logs a debug message
func Debug(format string, v ...interface{}) {
	// Only log debug messages if DEBUG environment variable is set to "true"
	if os.Getenv("DEBUG") != "true" {
		return
	}

	msg := fmt.Sprintf(format, v...)
	caller := getCallerInfo()
	debugLogger.Printf("%s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
}

// Fatal logs a fatal error message and exits the application
func Fatal(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	caller := getCallerInfo()
	errorLogger.Printf("FATAL: %s - %s - %s", time.Now().Format(time.RFC3339), caller, msg)
	os.Exit(1)
}
