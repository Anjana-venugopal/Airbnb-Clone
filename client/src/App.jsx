import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const CATEGORIES = [
  'All',
  'Lakefront',
  'Beachfront',
  'Cabins',
  'Iconic cities',
  'Countryside',
  'Trending',
];

export default function App() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Discovery & Search States
  const [listings, setListings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchLocation, setSearchLocation] = useState('');
  const [fetchingListings, setFetchingListings] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest',
  });

  // Load User & Fetch Listings
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
    fetchListings();
  }, [selectedCategory]);

  const fetchListings = async (search = searchLocation) => {
    setFetchingListings(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search.trim()) params.location = search.trim();

      const res = await api.get('/listings', { params });
      setListings(res.data.listings || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setFetchingListings(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings(searchLocation);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      
      {/* 1. Header / Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 40px',
        borderBottom: '1px solid #ebebeb',
        position: 'sticky',
        top: 0,
        backgroundColor: '#ffffff',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => { setSelectedCategory('All'); setSearchLocation(''); fetchListings(''); }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF385C', letterSpacing: '-0.5px' }}>airbnb</span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #dddddd',
            borderRadius: '40px',
            padding: '6px 8px 6px 16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            backgroundColor: '#ffffff'
          }}>
            <input
              type="text"
              placeholder="Search by city or location..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                width: '220px',
                color: '#222222'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#FF385C',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              🔍
            </button>
          </div>
        </form>

        {/* User Pill / Actions */}
        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#222222' }}>
                {user.name.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#ffffff',
                  color: '#717171',
                  border: '1px solid #dddddd',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setShowModal(true); setError(''); }}
              style={{
                padding: '9px 18px',
                backgroundColor: '#FF385C',
                color: '#ffffff',
                border: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Log in / Sign up
            </button>
          )}
        </div>
      </header>

      {/* 2. Category Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '24px',
        padding: '16px 40px',
        overflowX: 'auto',
        borderBottom: '1px solid #f0f0f0'
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: 'none',
              border: 'none',
              paddingBottom: '8px',
              fontSize: '14px',
              fontWeight: selectedCategory === cat ? '700' : '500',
              color: selectedCategory === cat ? '#000000' : '#717171',
              borderBottom: selectedCategory === cat ? '2px solid #000000' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Listings Grid */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 40px' }}>
        {fetchingListings ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#717171' }}>
            <p style={{ fontSize: '16px' }}>Loading properties...</p>
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#222222', margin: '0 0 8px 0' }}>No exact matches found</h3>
            <p style={{ color: '#717171', fontSize: '14px', margin: '0 0 16px 0' }}>
              Try changing or clearing your search filters.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchLocation(''); fetchListings(''); }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#222222',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            {listings.map((item) => (
              <div
                key={item._id}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {/* Image Box */}
                <div style={{
                  width: '100%',
                  paddingTop: '95%',
                  position: 'relative',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <img
                    src={
                      item.images && item.images.length > 0
                        ? `http://localhost:5001${item.images[0]}`
                        : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={item.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>

                {/* Details */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#222222', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                      {item.location || 'Special Stay'}
                    </h3>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#222222' }}>
                      ★ {item.ratingsAverage ? item.ratingsAverage.toFixed(1) : 'New'}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#717171', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: '14px', margin: '6px 0 0 0', color: '#222222' }}>
                    <span style={{ fontWeight: '700' }}>₹{item.pricePerNight?.toLocaleString()}</span> night
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              width: '90%',
              maxWidth: '380px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                {isLogin ? 'Log In' : 'Sign Up'}
              </h2>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!isLogin && (
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }}
              />

              {!isLogin && (
                <select
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff' }}
                >
                  <option value="guest">Guest (Book Stays)</option>
                  <option value="host">Host (List Properties)</option>
                </select>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  backgroundColor: '#FF385C',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '15px',
                  marginTop: '6px'
                }}
              >
                {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                style={{ color: '#FF385C', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </span>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}