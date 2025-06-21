import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { PiggyBank, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { clsx } from 'clsx';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAnimated, setIsAnimated] = useState(false);
  const { user, login, isLoading } = useAuth();

  // Trigger entrance animations after component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/member'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      } else {
        setSuccess('Login successful! Redirecting...');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center p-4 animate-gradient overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className={clsx(
        "max-w-md w-full space-y-8 transition-all duration-1000 ease-out",
        isAnimated ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      )}>
        {/* Logo and Title Section */}
        <div className="text-center">
          <div className={clsx(
            "flex items-center justify-center space-x-3 mb-8 transition-all duration-2000",
            "animate-float"
          )}>
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:rotate-3 hover:scale-110">
              <PiggyBank className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 tracking-tight">Kawempe</h1>
              <p className="text-lg text-secondary-600 font-medium">SACCO</p>
            </div>
          </div>
          <h2 className={clsx(
            "text-2xl font-bold text-secondary-900 transition-all duration-700 delay-300",
            isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}>
            Welcome back
          </h2>
          <p className={clsx(
            "mt-2 text-secondary-600 transition-all duration-700 delay-500",
            isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <Card 
          variant="glass" 
          padding="lg"
          className={clsx(
            "shadow-xl transition-all duration-700 delay-700",
            isAnimated ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          )}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5 transition-colors group-focus-within:text-primary-500" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all duration-200 ease-in-out
                    bg-white/70 backdrop-blur-sm"
                />
                <div className="absolute bottom-0 left-0 h-0.5 bg-primary-500 transform origin-left scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100 w-full"></div>
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5 transition-colors group-focus-within:text-primary-500" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all duration-200 ease-in-out
                    bg-white/70 backdrop-blur-sm"
                />
                <div className="absolute bottom-0 left-0 h-0.5 bg-primary-500 transform origin-left scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100 w-full"></div>
              </div>
            </div>

            {/* Feedback Messages */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg animate-fadeIn">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg animate-fadeIn">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3 text-lg"
              loading={isLoading}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 p-4 bg-secondary-50/80 backdrop-blur-sm rounded-lg border border-secondary-100">
            <p className="text-sm text-secondary-600 font-medium mb-2">Demo Credentials:</p>
            <p className="text-xs text-secondary-500">
              Admin: admin@kawempesacco.com / password123<br />
              Member: john.doe@gmail.com / password123
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className={clsx(
          "text-center text-xs text-secondary-500 transition-all duration-700 delay-1000",
          isAnimated ? "translate-y-0 opacity-70" : "translate-y-4 opacity-0"
        )}>
          © 2025 Kawempe SACCO. All rights reserved.
        </p>
      </div>
    </div>
  );
};
