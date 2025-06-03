import './App.css'
import { BrowserRouter, Routes, Route } from "react-router";
import Layout from './Layout';
import HomePage from '@/pages/landing/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import OTPPage from '@/pages/auth/OTPPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './ProtectedRoute';

function App() {
  

  return (
    <BrowserRouter>
    <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage/>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage/>} />
          </Route>
        </Route>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/signup" element={<RegisterPage/>} />
        <Route path="/otp" element={<OTPPage/>} />
    </Routes>
  </BrowserRouter>
  )
}

export default App