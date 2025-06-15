
// import { NavBar } from "./components/nav/NavBar";
import HeroSection from "./components/pages/landing/HeroSection";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Router components
import { AuthProvider } from "./context/AuthContext"; // 
import ListingsPage from './pages/auth/ListingsPage'; 
import LoginPage from "./pages/auth/LoginPage.tsx";
import RegisterPage from "./pages/auth/RegisterPage.tsx";
import OTPVerificationPage from "./pages/auth/OTPVerificationPage.tsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.tsx"; // For requesting OTP
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.tsx"; // For setting new password
import ChangePasswordPage from "./pages/auth/ChangePasswordPage.tsx"; // For authenticated users
import ChatPage from './pages/auth/ChatPage';
import ProfilePage from "./components/pages/profile/ProfilePage.tsx";
import CreateListingPage from "@/components/pages/seller/CreateListingPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute"; 
import DashboardPage from "./components/dashboard/DashboardPage.tsx";
import GoogleAuthCallbackPage from './pages/auth/GoogleAuthCallbackPage';
import ConversationsListPage from './pages/auth/ConversationsListPage';
import Layout from './Layout'; 

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Routes that use the shared Layout (NavBar, Footer) */}
          <Route path="/" element={<Layout />}>
            {/* Index route (what shows up at "/") */}
            <Route index element={<HeroSection />} />
            
            {/* Public listing page */}
            <Route path="/listings" element={<ListingsPage />} />

            {/* Protected routes that also use the layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="/chat/:conversationId" element={<ChatPage />} />
              <Route path="/messages" element={<ConversationsListPage />} /> 
            </Route>
            
            {/* Seller-only protected route */}
            <Route element={<ProtectedRoute allowedRoles={['seller']} unauthorizedMessage="Only sellers can create listings." />}>
              <Route path="/seller/create-listing" element={<CreateListingPage />} />
            </Route>
          </Route>

          {/* Routes that DO NOT use the shared Layout (e.g., full-screen auth pages) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/auth/google/success" element={<GoogleAuthCallbackPage />} />

          {/* Catch-all 404 Not Found page */}
          <Route path="*" element={
            <div className="flex items-center justify-center h-screen">
              <h1 className="text-center text-3xl text-red-500">404 - Page Not Found</h1>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
//add a game in 404 page 
export default App;
