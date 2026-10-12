import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icons when bundled with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
];

export default function App() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Discovery State
  const [listings, setListings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchLocation, setSearchLocation] = useState('');
  const [fetchingListings, setFetchingListings] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);

  // Day 12 Booking Engine State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingGuests, setBookingGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState(null); // { type: 'success' | 'error', msg: string }
  const [myBookings, setMyBookings] = useState([]);
  const [showBookingsModal, setShowBookingsModal] = useState(false);

  // Auth Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest',
  });

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

  const fetchUserBookings = async () => {
    if (!user) return;
    try {
      const res = await api.get('/bookings/my-bookings');
      setMyBookings(res.data.bookings || []);
      setShowBookingsModal(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fetch your bookings');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSelectedListing(null);
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
    setMyBookings([]);
  };

  // Stay calculation
  const calculateTotal = () => {
    if (!startDate || !endDate || !selectedListing) return { nights: 0, total: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { nights: 0, total: 0 };
    return {
      nights: diffDays,
      total: diffDays * selectedListing.pricePerNight,
    };
  };

  const { nights, total } = calculateTotal();

  // Day 12 Booking Submission with Collision Defense Handling
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingFeedback(null);

    if (!user) {
      setShowModal(true);
      return;
    }

    if (!startDate || !endDate) {
      setBookingFeedback({ type: 'error', msg: 'Please select both check-in and checkout dates.' });
      return;
    }

    if (nights <= 0) {
      setBookingFeedback({ type: 'error', msg: 'Checkout date must be after check-in date.' });
      return;
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/bookings', {
        listingId: selectedListing._id,
        startDate,
        endDate,
        guests: Number(bookingGuests),
        totalPrice: total,
      });

      setBookingFeedback({
        type: 'success',
        msg: `Booking confirmed! Reservation ID: ${res.data.booking._id.slice(-6)}`,
      });
      setStartDate('');
      setEndDate('');
    } catch (err) {
      const collisionMsg = err.response?.data?.message || 'This property is already booked for these dates. Please choose another date range.';
      setBookingFeedback({ type: 'error', msg: collisionMsg });
    } finally {
      setBookingLoading(false);
    }
  };

  const getCoordinates = (listing) => {
    if (
      listing?.locationGeo?.coordinates?.length === 2 &&
      (listing.locationGeo.coordinates[0] !== 0 || listing.locationGeo.coordinates[1] !== 0)
    ) {
      return [listing.locationGeo.coordinates[1], listing.locationGeo.coordinates[0]];
    }
    return [9.9312, 76.2673];
  };

  const resolveImage = (item, index) => {
    if (item?.images && item.images[index]) {
      const img = item.images[index];
      return img.startsWith('http') ? img : `http://localhost:5001${img}`;
    }
    return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      
      {/* 1. Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 40px',
        borderBottom: '1px solid #ebebeb',
        position: 'sticky',
        top: 0,
        backgroundColor: '#ffffff',
        zIndex: 1000
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} 
          onClick={() => { setSelectedListing(null); setSelectedCategory('All'); setSearchLocation(''); fetchListings(''); }}
        >
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF385C', letterSpacing: '-0.5px' }}>airbnb</span>
        </div>

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

        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={fetchUserBookings}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#f7f7f7',
                  color: '#222',
                  border: '1px solid #dddddd',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                My Bookings
              </button>
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

      {/* 2. Main View Area */}
      {selectedListing ? (
        /* DETAIL VIEW */
        <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '24px 20px 60px' }}>
          <button
            onClick={() => { setSelectedListing(null); setBookingFeedback(null); }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              color: '#222222',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Back to all stays
          </button>

          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#222222', margin: '0 0 6px 0' }}>
            {selectedListing.title}
          </h1>
          <p style={{ color: '#717171', fontSize: '15px', margin: '0 0 20px 0' }}>
            ★ {selectedListing.ratingsAverage ? selectedListing.ratingsAverage.toFixed(1) : 'New'} · <span style={{ textDecoration: 'underline', fontWeight: '500' }}>{selectedListing.location}</span>
          </p>

          {/* Photo Gallery Grid */}
          <div style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            height: '420px',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '36px',
            backgroundColor: '#f3f4f6'
          }}>
            <div style={{ flex: '2', height: '100%', position: 'relative' }}>
              <img
                src={resolveImage(selectedListing, 0)}
                alt="Main View"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_IMAGES[0];
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
              <div style={{ flex: '1', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={resolveImage(selectedListing, 1)}
                  alt="Angle 2"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_IMAGES[1];
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ flex: '1', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={resolveImage(selectedListing, 2)}
                  alt="Angle 3"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_IMAGES[2];
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>
          </div>

          {/* Two-Column Details & Reservation Engine */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '60px', alignItems: 'start' }}>
            <div>
              <div style={{ paddingBottom: '24px', borderBottom: '1px solid #ebebeb' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#222222', margin: '0 0 6px 0' }}>
                  Entire stay hosted by {selectedListing.host?.name || 'Local Host'}
                </h2>
                <p style={{ color: '#717171', fontSize: '15px', margin: 0 }}>
                  {selectedListing.maxGuests} guests · Category: {selectedListing.category}
                </p>
              </div>

              <div style={{ padding: '28px 0', borderBottom: '1px solid #ebebeb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>About this space</h3>
                <p style={{ color: '#333333', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                  {selectedListing.description}
                </p>
              </div>

              {/* Map View */}
              <div style={{ padding: '28px 0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Where you will be</h3>
                <div style={{
                  height: '340px',
                  width: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}>
                  <MapContainer
                    center={getCoordinates(selectedListing)}
                    zoom={13}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%', minHeight: '340px' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={getCoordinates(selectedListing)}>
                      <Popup>
                        <b>{selectedListing.title}</b><br />{selectedListing.location}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            </div>

            {/* Sticky Reservation Widget (Day 12 Submission & Collision Alert) */}
            <div style={{
              position: 'sticky',
              top: '110px',
              border: '1px solid #dddddd',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '18px' }}>
                <span style={{ fontSize: '22px', fontWeight: 'bold' }}>
                  ₹{selectedListing.pricePerNight?.toLocaleString()}
                  <span style={{ fontSize: '15px', fontWeight: 'normal', color: '#717171' }}> / night</span>
                </span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  ★ {selectedListing.ratingsAverage ? selectedListing.ratingsAverage.toFixed(1) : 'New'}
                </span>
              </div>

              {/* Collision / Success Feedback Banner */}
              {bookingFeedback && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  backgroundColor: bookingFeedback.type === 'success' ? '#ecfdf5' : '#fee2e2',
                  color: bookingFeedback.type === 'success' ? '#047857' : '#b91c1c',
                  border: `1px solid ${bookingFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  lineHeight: '1.4'
                }}>
                  <b>{bookingFeedback.type === 'success' ? '✓ ' : '✕ '}</b>
                  {bookingFeedback.msg}
                </div>
              )}

              {/* Form Controls */}
              <form onSubmit={handleBookingSubmit}>
                <div style={{ border: '1px solid #b0b0b0', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #b0b0b0' }}>
                    <div style={{ padding: '8px 12px', borderRight: '1px solid #b0b0b0' }}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#222222', textTransform: 'uppercase' }}>Check-in</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', paddingTop: '4px' }}
                      />
                    </div>
                    <div style={{ padding: '8px 12px' }}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#222222', textTransform: 'uppercase' }}>Checkout</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', paddingTop: '4px' }}
                      />
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#222222', textTransform: 'uppercase' }}>Guests</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedListing.maxGuests || 10}
                      value={bookingGuests}
                      onChange={(e) => setBookingGuests(e.target.value)}
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', paddingTop: '2px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#FF385C',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {bookingLoading ? 'Checking Availability...' : user ? 'Reserve' : 'Log in to Reserve'}
                </button>
              </form>

              {nights > 0 && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #ebebeb', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#333', marginBottom: '8px' }}>
                    <span>₹{selectedListing.pricePerNight?.toLocaleString()} x {nights} nights</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', borderTop: '1px solid #ebebeb', paddingTop: '12px', marginTop: '10px' }}>
                    <span>Total before taxes</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      ) : (
        /* DISCOVERY FEED */
        <>
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

          <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 40px' }}>
            {fetchingListings ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#717171' }}>
                <p style={{ fontSize: '16px' }}>Loading properties...</p>
              </div>
            ) : listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#222222', margin: '0 0 8px 0' }}>No exact matches found</h3>
                <p style={{ color: '#717171', fontSize: '14px', margin: '0 0 16px 0' }}>Try clearing filters or run the database seeder.</p>
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
                    onClick={() => { setSelectedListing(item); setBookingFeedback(null); }}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      paddingTop: '95%',
                      position: 'relative',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={resolveImage(item, 0)}
                        alt={item.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_IMAGES[0];
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>

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
        </>
      )}

      {/* 3. My Bookings Modal (Day 12 Inspection Drawer) */}
      {showBookingsModal && (
        <div
          onClick={() => setShowBookingsModal(false)}
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
              maxWidth: '540px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                Your Reservations
              </h2>
              <button
                type="button"
                onClick={() => setShowBookingsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {myBookings.length === 0 ? (
              <p style={{ color: '#717171', fontSize: '14px', textAlign: 'center', margin: '40px 0' }}>
                You have no upcoming trips booked yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {myBookings.map((b) => (
                  <div
                    key={b._id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <b style={{ fontSize: '15px', color: '#111827' }}>{b.listing?.title || 'Reserved Stay'}</b>
                      <span style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: b.status === 'confirmed' ? '#dcfce7' : '#fef9c3',
                        color: b.status === 'confirmed' ? '#15803d' : '#854d0e'
                      }}>
                        {b.status || 'Confirmed'}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0', fontSize: '13px', color: '#4b5563' }}>
                      📍 {b.listing?.location} · {b.guests} guest(s)
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                      📅 {new Date(b.startDate).toLocaleDateString()} &rarr; {new Date(b.endDate).toLocaleDateString()}
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>
                      Total Paid: ₹{b.totalPrice?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Auth Modal */}
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