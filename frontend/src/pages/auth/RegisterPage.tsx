import React, { useState } from "react";


import { useNavigate } from "react-router";

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    city: "",
    phone: "",
    role: "buyer",
  });

  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.username.trim()) newErrors.username = "Username is required";
    if (!form.email.includes("@")) newErrors.email = "Valid email is required";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.phone.trim() || !/^\d{10,}$/.test(form.phone))
        newErrors.phone = "Enter a valid phone number";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      console.log(form);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
  
  <div className="flex flex-col justify-center w-full max-w-2xl px-10 py-16 lg:px-20 mx-auto">
    <div className="mb-12">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
        Create your account
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
        Start your journey with us – it only takes a minute.
      </p>
    </div>
    <button
  onClick={() => navigate("/")}
  className="absolute top-6 left-6 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:underline"
>
  PassItPal
</button>


    <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit} noValidate>
      
      <div className="col-span-full md:col-span-1">
        <label htmlFor="username" className="formLabel">Username</label>
        <input
          id="username"
          name="username"
          value={form.username}
          onChange={handleChange}
          className="formInput"
          placeholder="Harkirat Singh"
        />
        {errors.username && (
            <p className="text-sm text-red-500 mt-1">{errors.username}</p>
        )}
      </div>

      
      <div className="col-span-full md:col-span-1">
        <label htmlFor="email" className="formLabel">Email</label>
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


      <div className="col-span-full md:col-span-1">
        <label htmlFor="phone" className="formLabel">Phone</label>
        <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="formInput"
            placeholder="9876543210"
        />
        {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
        )}
        </div>

      
      <div className="col-span-full md:col-span-1">
        <label htmlFor="password" className="formLabel">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="formInput"
          placeholder="********"
        />
        {errors.password && (
            <p className="text-sm text-red-500 mt-1">{errors.password}</p>
        )}
      </div>

      
      <div className="col-span-full md:col-span-1">
        <label htmlFor="city" className="formLabel">City</label>
        <input
          id="city"
          name="city"
          value={form.city}
          onChange={handleChange}
          className="formInput"
          placeholder="New Delhi"
        />
        {errors.city && (
            <p className="text-sm text-red-500 mt-1">{errors.city}</p>
        )}
      </div>

      
      <div className="col-span-full md:col-span-1">
        <label className="formLabel">Role</label>
        <div className="flex gap-4 pt-2">
          {["buyer", "seller"].map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="role"
                value={option}
                checked={form.role === option}
                onChange={handleChange}
                className="accent-blue-600"
              />
              <span className="capitalize">{option}</span>
            </label>
          ))}
        </div>
      </div>

      
      <div className="col-span-full pt-4">
        <button
          type="submit"
          className="w-full py-3 px-6 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition font-semibold"
        >
          Create Account
        </button>
      </div>
    </form>

    
    <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
      Already registered?{" "}
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        Login here
      </button>
    </p>
  </div>

  
  <div className="hidden lg:flex items-center justify-center w-full bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-800 dark:to-gray-900">
    
    <div className="max-w-sm text-center px-10">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
        Welcome aboard 🚀
      </h2>
      <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
        Join a vibrant marketplace where buyers and sellers connect meaningfully.
      </p>
    </div>
  </div>
</div>

  );
};

export default RegisterPage;
