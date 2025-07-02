
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
import HomePage from "./components/pages/landing/HomePage.tsx";
import SubmitReviewPage from "./components/pages/reviews/SubmitReviewPage.tsx";
import MessagingLayout from "./components/pages/messaging/MessagingLayout.tsx";
import AdminLayout from './components/admin/layout/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
// import ManageRoleRequests from './components/admin/ManageRoleRequests';
import ManageReports from './components/admin/ManageReports';
import ManageUsers from './components/admin/ManageUsers';
import ManageListings from './components/admin/ManageListings';
import PublicProfilePage from "./components/pages/profile/PublicProfilePage.tsx";
import AdvertisePage from './pages/auth/AdvertisePage';
import ManageAds from "./components/admin/ManageAds.tsx";
import AdPaymentPage from "./components/payments/AdPaymentPage.tsx";
import AboutPage from "./pages/auth/AboutPage.tsx";


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Routes that use the shared Layout (NavBar, Footer) */}
          <Route path="/" element={<Layout />}>
            {/* Index route (what shows up at "/") */}
            <Route index element={<HomePage />} />
            {/* Public listing page */}
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/profile/:userId" element={<PublicProfilePage />} />

            {/* Protected routes that also use the layout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  {/* <Route path="role-requests" element={<ManageRoleRequests />} /> */}
                  <Route path="reports" element={<ManageReports />} />
                  <Route path="users" element={<ManageUsers />} />
                  <Route path="listings" element={<ManageListings />} /> 
                  <Route path="ads" element={<ManageAds />} />
                  {/* We will add /users and /listings routes here later */}
                </Route>
              </Route>
              {/* <Route path="/chat/:conversationId" element={<ChatPage />} /> */}
              <Route path="/messages" element={<MessagingLayout />}>
                <Route index element={<ConversationsListPage />} />
                <Route path=":conversationId" element={<ChatPage />} />
              </Route>
              {/* <Route path="/messages" element={<ConversationsListPage />} />  */}
              <Route path="/submit-review/:orderId" element={<SubmitReviewPage />} />
            </Route>
            
            {/* Seller-only protected route */}
            <Route element={<ProtectedRoute allowedRoles={['seller']} unauthorizedMessage="Only sellers can create listings." />}>
              <Route path="/seller/create-listing" element={<CreateListingPage />} />
            </Route>
            <Route path="/advertise" element={<AdvertisePage />} />
          </Route>

          {/* Routes that DO NOT use the shared Layout (e.g., full-screen auth pages) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/auth/google/success" element={<GoogleAuthCallbackPage />} />
          <Route path="/ad-payment/:adId" element={<AdPaymentPage />} />
          <Route path="/about" element={<AboutPage />} />

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
