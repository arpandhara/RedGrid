import React from 'react';
import { SignUp } from "@clerk/clerk-react";
import { useTheme } from '../../context/ThemeContext';
import { dark } from '@clerk/themes';

const Register = () => {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-black p-4">
      <SignUp 
        appearance={{
          baseTheme: theme === 'dark' ? dark : undefined,
          elements: { card: 'shadow-xl border border-gray-200 dark:border-gray-800' }
        }}
        path="/register" 
        routing="path" 
        signInUrl="/login" 
      />
    </div>
  );
};

export default Register;