import { ValidateOtp } from "@/api";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import useAuthStore from "@/hooks/zustand/useAuthStore";



const OTPPage: React.FC = () => {
  const email = useAuthStore((state) => state.email);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter a valid 6-digit OTP");
      return;
    }
    console.log("OTP submitted:", otp);
    if(!email) {
      setError("Email not found");  
      return;
    }
    const response = await ValidateOtp(email, otp);
    if (response.success) {
      navigate("/login");
    } else {
      setError("Invalid OTP");
    }
    // console.log(response);
   
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col justify-center w-full max-w-md px-6 pt-12 lg:px-10 mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Enter OTP</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          We've sent a 6-digit code to your registered number/email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="otp" className="formLabel">OTP</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={handleChange}
              className="formInput tracking-widest text-center text-lg"
              placeholder="______"
              maxLength={6}
            />
            <div className="min-h-[1rem] mt-1">
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition font-semibold"
          >
            Verify OTP
          </button>
        </form>

        <button
          type="button"
          className="mt-4 text-sm text-blue-600 hover:underline dark:text-blue-400"
          onClick={() => console.log("Resend OTP")}
        >
          Resend OTP
        </button>

        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:underline"
        >
          PassItPal
        </button>
      </div>
    </div>
  );
};

export default OTPPage;
