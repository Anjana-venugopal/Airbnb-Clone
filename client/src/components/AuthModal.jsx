import React, { useState } from 'react';
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

  // If not open, render NOTHING so clicks pass through
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
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            {isLoginView ? 'Log In' : 'Sign Up'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ color: '#e11d48', backgroundColor: '#ffe4e6', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isLoginView && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              value={formData.name}
              onChange={handleChange}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            value={formData.email}
            onChange={handleChange}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={formData.password}
            onChange={handleChange}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' }}
          />

          {!isLoginView && (
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: '#fff' }}
            >
              <option value="guest">Guest (Book Stays)</option>
              <option value="host">Host (List Properties)</option>
            </select>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px',
              backgroundColor: '#FF385C',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            {isSubmitting ? 'Please wait...' : isLoginView ? 'Continue' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#555' }}>
          {isLoginView ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError('');
            }}
            style={{ color: '#FF385C', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLoginView ? 'Sign Up' : 'Log In'}
          </span>
        </p>
      </div>
    </div>
  );
}