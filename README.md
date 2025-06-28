# CampusCupid

**A modern dating application designed specifically for college students to connect and build meaningful relationships in a secure and engaging environment.**

## 🎯 Project Overview

CampusCupid is a full-stack dating application that helps college students find compatible matches based on their preferences, interests, and location. The platform combines the excitement of modern dating apps with robust security features and privacy controls.

## ✨ Key Features

### 🔐 Authentication & Security
- **Secure Registration**: Email-based registration with password hashing using bcrypt
- **JWT Authentication**: Token-based authentication with 24-hour expiration
- **Age Verification**: Mandatory 18+ age verification during signup
- **Data Privacy**: GDPR-compliant data handling and user privacy controls

### 👤 Profile Management
- **Rich Profiles**: Comprehensive user profiles with photos, interests, and bio
- **Photo Upload**: Secure image hosting via Cloudinary integration
- **Location Services**: Geolocation support with reverse geocoding
- **Preference Settings**: Customizable age range, distance, and gender preferences
- **Profile Editing**: Real-time profile updates with validation

### 💕 Smart Matching System
- **Intelligent Algorithm**: Advanced matching based on preferences, interests, and location
- **Swipe Interface**: Intuitive left/right swipe functionality (mobile & desktop)
- **Keyboard Support**: Arrow key navigation for accessibility
- **Mutual Matching**: Real-time match notifications when both users like each other
- **Match Filtering**: Filter matches by age, distance, and gender preferences

### 💬 Messaging System
- **Real-time Chat**: Instant messaging between matched users only
- **Message Threading**: Organized conversation threads with timestamps
- **Read Receipts**: Message read status tracking
- **Conversation Management**: Overview of all active conversations with unread counts
- **Security**: Messages only available between mutually matched users

### 🛡️ Safety & Moderation
- **User Reporting**: Report inappropriate behavior with detailed reasons
- **Block/Unblock**: Block unwanted users from seeing or contacting you
- **Unmatch Feature**: Remove existing matches when needed
- **Admin Dashboard**: Administrative tools for content moderation
- **Activity Logging**: Track user interactions for safety monitoring

### 📱 User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Material-UI**: Modern, accessible interface with consistent design language
- **Progressive Web App**: App-like experience on mobile browsers
- **Dark/Light Theme**: Theme support for user preference
- **Smooth Animations**: Engaging transitions and micro-interactions

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.1.0 with React Router for navigation
- **UI Library**: Material-UI (MUI) 6.4.6 for modern, accessible components
- **State Management**: React Hooks (useState, useEffect, useContext)
- **HTTP Client**: Axios for API communication
- **Styling**: Emotion for styled components and custom theming
- **Date Handling**: date-fns for date formatting and calculations
- **Build Tool**: Create React App with Webpack
- **Package Manager**: npm

### Backend
- **Language**: Go 1.23.5
- **Framework**: Gin (high-performance HTTP web framework)
- **Database ORM**: GORM with PostgreSQL driver
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Cloudinary for secure image hosting
- **API Documentation**: Swagger/OpenAPI integration
- **Middleware**: CORS, authentication, and logging middleware
- **Environment**: godotenv for configuration management

### Database
- **Primary Database**: PostgreSQL with GORM ORM
- **Connection Pooling**: Optimized database connections
- **Migrations**: Automatic schema migrations
- **Data Models**: User profiles, interactions, messages, and reports

### Cloud Services
- **Image Storage**: Cloudinary for photo uploads and transformations
- **Deployment**: Render.com for backend hosting
- **Database Hosting**: PostgreSQL cloud instance
- **Environment Variables**: Secure configuration management

### Testing
- **Frontend Testing**: Cypress for end-to-end testing
- **Component Testing**: React Testing Library and Jest
- **Backend Testing**: Go's built-in testing framework
- **API Testing**: Comprehensive endpoint testing with various scenarios

## 🏗️ Architecture

### Frontend Structure
```
Frontend/
├── src/
│   ├── components/
│   │   ├── LandingPage.js       # Marketing landing page
│   │   ├── LoginPage.js         # User authentication
│   │   ├── SignUpPage.js        # Multi-step registration
│   │   ├── Dashboard.js         # User dashboard overview
│   │   ├── matcher.js           # Swipe/matching interface
│   │   ├── MatchesPage.js       # Messages and matches
│   │   ├── EditProfilePage.js   # Profile management
│   │   ├── SettingsPage.js      # User preferences
│   │   └── common/
│   │       ├── NavBar.js        # Navigation component
│   │       └── ThemeProvider.js # Theme configuration
│   └── App.js                   # Main application router
```

### Backend Structure
```
backend/
├── main.go                      # Application entry point
├── handlers/
│   ├── user.go                  # Authentication & profile management
│   ├── upload.go                # File upload handling
│   ├── activity_log.go          # User activity tracking
│   └── admin_reports.go         # Administrative features
├── models/
│   └── user.go                  # Data models and validation
├── middleware/
│   └── auth.go                  # JWT authentication middleware
├── database/
│   └── db.go                    # Database connection and configuration
├── storage/
│   └── cloudinary.go            # Cloud storage integration
└── docs/
    └── swagger.yaml             # API documentation
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **Go** (v1.19 or higher)
- **PostgreSQL** (v12 or higher)
- **Cloudinary Account** (for image storage)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/anayy09/CampusCupid.git
   cd CampusCupid/backend
   ```

2. **Install dependencies**
   ```bash
   go mod download
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=campuscupid
   DB_PORT=5432
   
   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Server Configuration
   PORT=8080
   DEBUG=true
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb campuscupid
   ```

5. **Run the backend server**
   ```bash
   go run main.go
   ```

   The server will start on `http://localhost:8080`
   API documentation available at `http://localhost:8080/swagger/index.html`

### Frontend Setup

1. **Navigate to Frontend directory**
   ```bash
   cd ../Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

   The application will open at `http://localhost:3000`

### Testing

**Frontend Tests**
```bash
# Run Cypress end-to-end tests
npm run cypress:open

# Run Jest unit tests
npm test
```

**Backend Tests**
```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...
```

## 📡 API Documentation

The backend provides a comprehensive REST API with the following main endpoints:

### Authentication
- `POST /register` - User registration
- `POST /login` - User authentication

### Profile Management
- `GET /profile/:user_id` - Get user profile
- `PUT /profile/:user_id` - Update user profile
- `DELETE /profile/:user_id` - Delete user account
- `PUT /preferences/:user_id` - Update user preferences

### Matchmaking
- `GET /matches/:user_id` - Get potential matches
- `POST /like/:target_id` - Like a user
- `POST /dislike/:target_id` - Dislike a user
- `POST /unmatch/:user_id` - Remove a match

### Messaging
- `POST /messages` - Send a message
- `GET /messages/:user_id` - Get conversation
- `GET /conversations` - Get all conversations

### Safety Features
- `POST /report/:target_id` - Report a user
- `POST /block/:target_id` - Block a user
- `DELETE /block/:target_id` - Unblock a user

### File Management
- `POST /upload/photos` - Upload profile photos
- `DELETE /upload/photos` - Delete photos

**Complete API documentation**: Available at `/swagger/index.html` when running the backend server.

## 🧪 Testing Strategy

### Frontend Testing
- **Component Testing**: Individual component functionality
- **Integration Testing**: User workflows and interactions
- **End-to-End Testing**: Complete user journeys from signup to messaging
- **Accessibility Testing**: Screen reader compatibility and keyboard navigation

### Backend Testing
- **Unit Testing**: Individual function and method testing
- **API Testing**: Endpoint functionality and error handling
- **Database Testing**: Data integrity and relationship validation
- **Security Testing**: Authentication and authorization flows

## 🔒 Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries via GORM
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Rate Limiting**: API rate limiting to prevent abuse
- **Data Sanitization**: Clean user inputs before processing

## 🚀 Deployment

### Backend Deployment (Render.com)
1. Connect GitHub repository to Render
2. Configure environment variables
3. Set build command: `go build -o main .`
4. Set start command: `./main`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to static hosting service (Netlify, Vercel, etc.)
3. Configure environment variables for API endpoints

## 👥 Team Members

- **[Anay Sinhal](https://github.com/anayy09)** - Backend Developer
- **[Abhijeet Mallick](https://github.com/abhijeetmallick65)** - Backend Developer
- **[Rijul Bir Singh](https://github.com/rijul21)** - Frontend Developer  
- **[Ethan Klasky](https://github.com/E53klasky)** - Frontend Developer

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

