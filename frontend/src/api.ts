import type { User, ListingsResponse } from '@/types';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  city: string;
  phone: string;
  role: 'buyer' | 'seller';
}

const backendUrl = import.meta.env.VITE_PASSITPALBACKEND;

const RegisterUser = async (formData: RegisterFormData): Promise<{ message: string; user: User; token: string }> => {
  const response = await fetch(`${backendUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: formData.email,
      password: formData.password,
      username: formData.username,
      mobileNumber: formData.phone,
      role: formData.role,
      city: formData.city,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }

  const data = await response.json();
  return {
    message: data.message,
    user: data.user as User,
    token: data.token
  };
};


const ValidateOtp = async (email: string, otp: string): Promise<{ success: boolean;  }> => {
  const response = await fetch(`${backendUrl}/api/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      otp: otp,
      type: 'email',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'OTP verification failed');
  }

  
  return {
    success: true,
    
  };
  
};

const LoginUser = async (email: string, password: string): Promise<{ success: boolean; token: string; user: User }> => {
  const response = await fetch(`${backendUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  }); 

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }

  const data = await response.json();
  console.log("GOT THIS DATA FOR USER");  
  console.log(data.user);
  return {
    success: true,
    token: data.token,
    user: data.user as User,
  };
};




const getListings = async (): Promise<ListingsResponse> => {
  const response = await fetch(`${backendUrl}/api/listings`);
  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }
  return await response.json();
};

export { RegisterUser, ValidateOtp, LoginUser, getListings };
