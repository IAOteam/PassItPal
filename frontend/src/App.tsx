
import { NavBar } from "./components/nav/NavBar";
import HeroSection from "./components/pages/landing/HeroSection";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Router components
import { AuthProvider } from "./context/AuthContext"; // 

import LoginPage from "./pages/auth/LoginPage.tsx";
import RegisterPage from "./pages/auth/RegisterPage.tsx";
import OTPVerificationPage from "./pages/auth/OTPVerificationPage.tsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.tsx"; // For requesting OTP
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.tsx"; // For setting new password
import ChangePasswordPage from "./pages/auth/ChangePasswordPage.tsx"; // For authenticated users

import ProfilePage from "./components/pages/profile/ProfilePage.tsx";
import CreateListingPage from "@/components/pages/seller/CreateListingPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute"; 
import DashboardPage from "./components/dashboard/DashboardPage.tsx";

function App() {
  return (
    <Router> {/* Wrap the entire application with Router */}
      <AuthProvider> {/* AuthProvider still wraps everything below it */}
        <div className="pagePadding">
          <NavBar /> {/* NavBar should be outside Routes if it's always present */}

          <Routes> {/* Defining  routes here */}
            <Route path="/" element={<HeroSection />} /> {/*  landing page */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* OTP verification can be dynamic based on purpose (email verification or password reset) */}
            <Route path="/verify-otp" element={<OTPVerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            {/* Reset password will typically take a token from the URL, but we'll use query params for simplicity initially */}
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} /> {/* Assuming you have this */}
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['seller']} unauthorizedMessage="Only sellers can create listings." />}> {/* Protect for sellers only */}
              <Route path="/seller/create-listing" element={<CreateListingPage />} />
            </Route>

            {/* Optionally, a 404 Not Found page */}
            <Route path="*" element={<h1 className="text-center mt-20 text-3xl text-red-500">404 - Page Not Found</h1>} />
            </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;