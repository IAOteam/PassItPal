import React from "react";
import useAuthStore from "@/hooks/zustand/useAuthStore";
import { useNavigate } from "react-router";

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl">You are not logged in.</h2>
        <button onClick={() => navigate("/login")} className="mt-4 text-blue-600 underline">Go to Login</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user.username}!</h1>
      <div className="space-y-4">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        
        <p><strong>City:</strong> {user.city || "N/A"}</p>
        
      </div>
      <button onClick={logout} className="mt-6 bg-red-600 text-white px-4 py-2 rounded">
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;
