import './App.css'
import { BrowserRouter, Routes, Route } from "react-router";
import Layout from './Layout';
import HomePage from '@/pages/landing/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';


function App() {
  

  return (
    <BrowserRouter>
    <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage/>} />
        </Route>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/signup" element={<RegisterPage/>} />
    </Routes>
  </BrowserRouter>
  )
}

export default App