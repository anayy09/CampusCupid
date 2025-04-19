import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from './components/SignUpPage';
import MatcherPage from "./components/matcher";
import DashboardPage from "./components/Dashboard";
import MatchesPage from "./components/MatchesPage";

function App() {
  return (
    <Router>
      <Routes>
         {/* Route for Home Page */}
        <Route path="/" element={<LandingPage />} />
         {/* Route for Login Page */}
        <Route path="/login" element={<LoginPage />} />
         {/* Route for Signup Page */}
        <Route path="/signup" element={<SignUpPage />} />
         {/* Route for Dashboard Page */}
         <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/matcher" element={<MatcherPage />} />
        <Route path="/matches" element={<MatchesPage />} />
      </Routes>
    </Router>
  );
}

export default App;