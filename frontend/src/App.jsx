import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Moon, Sun, HeartPulse, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    bloodGroup: 'A+'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simple validation
    if(!formData.username || !formData.email || !formData.password) {
       toast.error("Please fill all fields");
       setLoading(false);
       return;
    }

    try {
      // Using axios as per your package.json
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      
      toast.success('Account Created! Check MongoDB.');
      console.log('Server Response:', response.data);
      
      // Reset form
      setFormData({...formData, username: '', email: '', password: ''});
      
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Connection failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Join RedGrid</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Save a life today.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
          <input 
            type="text" 
            name="username"
            value={formData.username}
            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
            placeholder="JohnDoe"
            onChange={handleChange}
          />
        </div>
        
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
            placeholder="john@example.com"
            onChange={handleChange}
          />
        </div>

        {/* Blood Group */}
        <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Blood Group</label>
           <select 
             name="bloodGroup" 
             value={formData.bloodGroup}
             onChange={handleChange}
             className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
           >
             {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
               <option key={bg} value={bg}>{bg}</option>
             ))}
           </select>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
            placeholder="••••••••"
            onChange={handleChange}
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4 font-bold text-white bg-primary rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-900 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800 transition-colors">
      <div className="flex items-center space-x-2">
        <HeartPulse className="w-8 h-8 text-primary" />
        <span className="text-xl font-bold tracking-wide text-gray-800 dark:text-white">RedGrid</span>
      </div>
      <button 
        onClick={toggleTheme} 
        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
    </nav>
  );
};

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-light dark:bg-black transition-colors duration-300">
        <Navbar />
        <Toaster position="top-right" />
        <main className="flex items-center justify-center p-4 mt-10">
          <RegisterForm />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;