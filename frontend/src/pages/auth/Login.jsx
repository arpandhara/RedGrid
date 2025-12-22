import React from 'react';
import { SignIn } from "@clerk/clerk-react";
import { useTheme } from '../../context/ThemeContext';
import { dark } from '@clerk/themes';

const Login = () => {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-black p-4">
      <SignIn 
        appearance={{
          baseTheme: theme === 'dark' ? dark : undefined,
          elements: { card: 'shadow-xl border border-gray-200 dark:border-gray-800' }
        }} 
        path="/login" 
        routing="path" 
        signUpUrl="/register" 
      />
    </div>
  );
};

export default Login;