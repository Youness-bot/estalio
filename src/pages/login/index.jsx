import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginHeader from './components/LoginHeader';
import LanguageSelector from './components/LanguageSelector';
import LoginForm from './components/LoginForm';
import ThemeToggle from './components/ThemeToggle';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, loading: authLoading, initError } = useAuth();
  
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Show configuration error if Supabase is not properly initialized
  useEffect(() => {
    if (initError) {
      setError(initError);
    }
  }, [initError]);

  useEffect(() => {
    // Redirect if already authenticated
    if (signIn?.user) {
      navigate('/dashboard');
      return;
    }

    // Load saved preferences
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    setCurrentLanguage(savedLanguage);
    setIsDarkMode(savedTheme === 'dark');
    
    // Apply theme
    if (savedTheme === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
    
    // Apply RTL for Arabic
    if (savedLanguage === 'ar') {
      document.documentElement?.setAttribute('dir', 'rtl');
    } else {
      document.documentElement?.setAttribute('dir', 'ltr');
    }
  }, [navigate, signIn?.user]);

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
    
    // Apply RTL layout for Arabic
    if (language === 'ar') {
      document.documentElement?.setAttribute('dir', 'rtl');
    } else {
      document.documentElement?.setAttribute('dir', 'ltr');
    }
  };

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  };

  const handleAuth = async (formData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (formData?.isSignUp) {
        // Sign up with profile data
        const { data, error } = await signUp(
          formData?.email,
          formData?.password,
          formData?.fullName,
          formData?.role
        );
        
        if (error) {
          console.error('Signup error:', error);
          setError(error?.message || 'Signup failed. Please try again.');
          return;
        }
        
        setSuccess('Account created successfully! Please check your email for verification link before signing in.');
        
      } else {
        // Sign in
        const { data, error } = await signIn(formData?.email, formData?.password);
        
        if (error) {
          console.error('Login error:', error);
          setError(error?.message || 'Login failed. Please check your credentials.');
          return;
        }
        
        if (data?.user) {
          // Store preferences
          localStorage.setItem('rememberMe', formData?.rememberMe?.toString());
          setSuccess('Login successful! Redirecting...');
          // Navigation is handled automatically by AuthContext and ProtectedRoute
        }
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <ThemeToggle isDarkMode={isDarkMode} onToggle={handleThemeToggle} />
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-card p-8">
          <LoginHeader currentLanguage={currentLanguage} />
          
          <LanguageSelector 
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}
          
          <LoginForm
            currentLanguage={currentLanguage}
            onSubmit={handleAuth}
            isLoading={isLoading}
          />
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date()?.getFullYear()} PropertyFlow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}