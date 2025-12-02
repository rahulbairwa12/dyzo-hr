import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import DyzoLogo from '@/assets/images/logo/dyzo-ai-logo.png';

const DeveloperPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoaded(true);
    const developerToken = localStorage.getItem('developer_token');
    if (developerToken) {
      navigate('/developer/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_APP_DJANGO}/developer/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (data.status === 1) {
        localStorage.setItem('developer_token', data.token);
        localStorage.setItem('developer_refresh_token', data.refresh_token);
        localStorage.setItem('developer_user', JSON.stringify(data.user));
        navigate('/developer/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_APP_DJANGO}/developer/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password
        })
      });

      const data = await response.json();

      if (data.status === 1) {
        setLoginData({ email: signupData.email, password: signupData.password });
        setActiveTab('login');
        setError('Account created successfully! Please login.');
        setSignupData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={DyzoLogo} alt="Dyzo" className="h-8 w-auto" />
              <div className="h-6 w-px bg-gray-700"></div>
              <span className="text-white text-lg font-semibold font-mono">&lt;/&gt; Developer API</span>
            </div>
            
            <button
              onClick={() => navigate('/api-documentation')}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors border border-gray-700 hover:border-gray-600 rounded-lg"
            >
              <Icon icon="heroicons:book-open" className="h-4 w-4" />
              Documentation
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Left Side - Developer Hero */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gray-950 relative overflow-hidden">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
          
          <div className="max-w-lg relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-mono">API v1.0 • Online</span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              <span className="text-gray-400 font-mono text-xl">$</span> Build with Dyzo APIs
            </h1>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Access powerful project management, team collaboration, and time tracking APIs. Get started in minutes.
            </p>

            {/* Terminal-style feature list */}
            <div className="space-y-3">
              {[
                { icon: 'heroicons:bolt', text: 'Fast & Reliable', detail: '<100ms avg' },
                { icon: 'heroicons:shield-check', text: 'Secure Auth', detail: 'JWT-based' },
                { icon: 'heroicons:code-bracket', text: 'RESTful API', detail: 'Standard HTTP' },
                { icon: 'heroicons:book-open', text: 'Well Documented', detail: 'Complete ref' }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center">
                    <Icon icon={feature.icon} className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-medium text-sm">{feature.text}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{feature.detail}</span>
                </div>
              ))}
            </div>

            {/* Code snippet decoration */}
            <div className="mt-8 p-4 bg-black/30 border border-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <code className="text-xs font-mono text-gray-400">
                <span className="text-blue-400">const</span> <span className="text-white">api</span> = <span className="text-green-400">'dyzo.com/api'</span>;
              </code>
            </div>
          </div>
        </div>

        {/* Right Side - Auth */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-900">
          <div className="w-full max-w-md">
            {/* Tabs */}
            <div className="flex border-b border-gray-800 mb-8">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${
                  activeTab === 'login' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Sign in
                {activeTab === 'login' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${
                  activeTab === 'signup' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Sign up
                {activeTab === 'signup' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex gap-3">
                  <Icon icon="heroicons:exclamation-circle" className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>
            )}

            {/* Signup Form */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create account'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By signing up, you agree to our Terms and Privacy Policy
                </p>
              </form>
            )}

            {/* Footer Link */}
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/api-documentation')}
                className="text-sm text-gray-400 hover:text-green-400 transition-colors inline-flex items-center gap-1.5"
              >
                <Icon icon="heroicons:arrow-right" className="h-4 w-4" />
                Browse API documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPortal;
