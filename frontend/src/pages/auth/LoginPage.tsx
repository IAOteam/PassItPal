import React, { useState } from "react";
import { useNavigate } from "react-router";

const LoginPage: React.FC = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.email.includes("@")) newErrors.email = "Valid email is required";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      console.log("Form submitted", form);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 relative">
      {/* Home/Brand Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:underline"
      >
        PassItPal
      </button>

      {/* Left panel: Form */}
      <div className="flex flex-col justify-center w-full max-w-2xl px-10 py-16 lg:px-20 mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
            Welcome back! Please enter your credentials.
          </p>
        </div>

        <form className="grid grid-cols-1 gap-6 max-w-md"  onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className="formLabel">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="formInput"
              placeholder="harkirat@gmail.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="formLabel">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="formInput"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition font-semibold"
            >
              Login
            </button>
          </div>
        </form>

        {/* Redirect to register */}
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Create one
          </button>
        </p>
      </div>

      {/* Right panel: Optional illustration */}
      <div className="hidden lg:flex items-center justify-center w-full bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-sm text-center px-10">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Welcome back 👋
          </h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
            We're glad to have you. Let's get you signed in and started.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
