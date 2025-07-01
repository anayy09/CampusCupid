import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from './components/SignUpPage';
import MatcherPage from "./components/matcher";
import DashboardPage from "./components/Dashboard";
import MatchesPage from "./components/MatchesPage";
import SettingsPage from "./components/SettingsPage";
import ActivityLogPage from "./components/ActivityLogPage";
import AdminReportsPage from "./components/AdminReportsPage";
import ThemeProvider from "./components/common/ThemeProvider";
import { CssBaseline } from "@mui/material";
import EditProfilePage from "./components/EditProfilePage";

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/matcher" element={<MatcherPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/editprofile" element={<EditProfilePage />} />
          <Route path="/activity" element={<ActivityLogPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;