import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const endpoint = isLoginView ? '/auth/login' : '/auth/register';
    const payload = isLoginView
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await api.post(endpoint, payload);
      login(res.data.user, res.data.token);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-100 transition text-gray-500"
          >
            <X size={20} />
          </button>
          <h2 className="text-base font-semibold text-gray-900">
            {isLoginView ? 'Log in' : 'Sign up'}
          </h2>
          <div className="w-5" />
        </div>

        {/* Form Body */}
        <div className="p-6">
          <h3 className="text-xl font-medium text-gray-900 mb-4">
            Welcome to Airbnb
          </h3>

          {error && (
            <div className="mb-4 p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              />
            </div>

            {!isLoginView && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  I want to
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                >
                  <option value="guest">Book stays (Guest)</option>
                  <option value="host">List properties (Host)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition"
            >
              {isSubmitting ? 'Processing...' : isLoginView ? 'Continue' : 'Create Account'}
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLoginView(!isLoginView);
                setError('');
              }}
              className="font-semibold text-rose-500 hover:underline ml-1"
            >
              {isLoginView ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}