import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
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

const DEFAULT_LISTINGS = [
  {
    _id: 'l1',
    title: 'Heritage Backwater Villa',
    description: 'Authentic Kerala wooden architecture on serene backwaters with private boat access and lush views.',
    category: 'Lakefront',
    location: 'Alleppey',
    pricePerNight: 4500,
    maxGuests: 4,
    ratingsAverage: 4.9,
    host: { name: 'Priya Nair' },
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [76.3388, 9.4981] },
  },
  {
    _id: 'l2',
    title: 'Cliffside Sunset Cottage',
    description: 'Panoramic Arabian Sea sunsets perched directly atop the scenic North Cliff walking trail.',
    category: 'Beachfront',
    location: 'Varkala',
    pricePerNight: 3200,
    maxGuests: 2,
    ratingsAverage: 4.8,
    host: { name: 'Rahul V' },
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [76.7163, 8.7379] },
  },
  {
    _id: 'l3',
    title: 'Misty Hills Tea Plantation Cabin',
    description: 'Cool mountain retreat surrounded by green tea fields, waking up to crisp cloudscapes.',
    category: 'Cabins',
    location: 'Munnar',
    pricePerNight: 5200,
    maxGuests = 6,
    ratingsAverage: 4.95,
    host: { name: 'Eldo George' },
    images: [
      'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [77.0595, 10.0889] },
  },
  {
    _id: 'l4',
    title: 'Portuguese Courtyard Villa',
    description: 'Restored colonial heritage home with private plunge pool, lush palms, and heritage tiled verandas.',
    category: 'Trending',
    location: 'Goa',
    pricePerNight: 7800,
    maxGuests: 6,
    ratingsAverage: 4.7,
    host: { name: 'Maria Fernandez' },
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [73.8567, 15.2993] },
  },
  {
    _id: 'l5',
    title: 'Himalayan Cedar Wood Chalet',
    description: 'Cozy alpine timber chalet with panoramic views of snow-capped Pir Panjal peaks.',
    category: 'Cabins',
    location: 'Manali',
    pricePerNight: 6100,
    maxGuests: 4,
    ratingsAverage: 5.0,
    host: { name: 'Karan Thakur' },
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [77.1892, 32.2432] },
  },
  {
    _id: 'l6',
    title: 'Royal Haveli Courtyard Suite',
    description: 'Intricate sandstone jali windows, hand-carved pillars, and traditional rooftop dining over the Pink City.',
    category: 'Iconic cities',
    location: 'Jaipur',
    pricePerNight: 4900,
    maxGuests: 3,
    ratingsAverage: 4.85,
    host: { name: 'Aditya Singh' },
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [75.7873, 26.9124] },
  },
  {
    _id: 'l7',
    title: 'Valley View Glass Studio',
    description: 'Modern minimalist studio looking directly over deep pine valleys with majestic sunset views.',
    category: 'Trending',
    location: 'Kasauli',
    pricePerNight: 6800,
    maxGuests: 2,
    ratingsAverage: 4.9,
    host: { name: 'Simran K' },
    images: [
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [76.9649, 30.9013] },
  },
  {
    _id: 'l8',
    title: 'Rainforest Eco Treehouse',
    description: 'Handcrafted wooden treehouse nestled inside dense coffee groves with fresh mountain streams.',
    category: 'Countryside',
    location: 'Coorg',
    pricePerNight: 4300,
    maxGuests: 2,
    ratingsAverage: 4.75,
    host: { name: 'Muthappa C' },
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [75.7382, 12.3375] },
  },
  {
    _id: 'l9',
    title: 'Colonial Hilltop Stone Villa',
    description: 'Quaint British-era stone bungalow enveloped by morning fog and strawberry gardens.',
    category: 'Countryside',
    location: 'Mahabaleshwar',
    pricePerNight: 5600,
    maxGuests: 5,
    ratingsAverage: 4.88,
    host: { name: 'Rohan Deshmukh' },
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [73.6602, 17.9307] },
  },
  {
    _id: 'l10',
    title: 'Dal Lake Cedar Wood Houseboat',
    description: 'Hand-carved floating cedar palace featuring Kashmiri silk carpets and mountain reflections.',
    category: 'Lakefront',
    location: 'Srinagar',
    pricePerNight: 8500,
    maxGuests: 4,
    ratingsAverage: 4.96,
    host: { name: 'Bashir Ahmed' },
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    locationGeo: { type: 'Point', coordinates: [74.8723, 34.0837] },
  },
];

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : { name: 'Demo Guest', role: 'guest' };
  });

  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [listings, setListings] = useState(DEFAULT_LISTINGS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingGuests, setBookingGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [showBookingsModal, setShowBookingsModal] = useState(false);

  const [reviews, setReviews] = useState([
    {
      _id: 'r1',
      rating: 5,
      comment: 'Breathtaking views, spotless amenities, and wonderful host hospitality. Will return!',
      user: { name: 'Ananya' },
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'r2',
      rating: 5,
      comment: 'Exactly as shown in the photos. Peaceful ambiance and close to local spots.',
      user: { name: 'Vikram' },
      createdAt: new Date().toISOString(),
    },
  ]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState(null);

  const [showHostModal, setShowHostModal] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    category: 'Lakefront',
    location: '',
    pricePerNight: '',
    maxGuests: 2,
    imageUrl1: '',
    imageUrl2: '',
    latitude: 9.9312,
    longitude: 76.2673,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest',
  });

  useEffect(() => {
    fetchListings();
  }, [selectedCategory]);

  const fetchListings = async (search = searchLocation) => {
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search.trim()) params.location = search.trim();

      const res = await api.get('/listings', { params });
      if (res.data?.listings && res.data.listings.length > 0) {
        setListings(res.data.listings);
        return;
      }
    } catch (err) {
      // Backend not running / GitHub pages static mode -> filter fallback list
    }

    let filtered = DEFAULT_LISTINGS;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    if (search.trim()) {
      filtered = filtered.filter((item) =>
        item.location.toLowerCase().includes(search.trim().toLowerCase()) ||
        item.title.toLowerCase().includes(search.trim().toLowerCase())
      );
    }
    setListings(filtered);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSelectedListing(null);
    fetchListings(searchLocation);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    try {
      await api.post('/reviews', {
        listingId: selectedListing._id,
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
      });
    } catch (err) {
      // Keep working in offline/static mode
    }

    const newRev = {
      _id: 'rev_' + Date.now(),
      rating: Number(reviewRating),
      comment: reviewComment.trim(),
      user: { name: user?.name || 'You' },
      createdAt: new Date().toISOString(),
    };
    setReviews([newRev, ...reviews]);
    setReviewFeedback({ type: 'success', msg: 'Review published successfully!' });
    setReviewComment('');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingFeedback(null);

    if (!startDate || !endDate) {
      setBookingFeedback({ type: 'error', msg: 'Please select both check-in and checkout dates.' });
      return;
    }

    setBookingLoading(true);
    setTimeout(() => {
      const newBooking = {
        _id: 'bk_' + Date.now(),
        listing: selectedListing,
        startDate,
        endDate,
        guests: Number(bookingGuests),
        totalPrice: total,
        status: 'confirmed',
      };
      setMyBookings([newBooking, ...myBookings]);
      setBookingFeedback({
        type: 'success',
        msg: `Booking confirmed! Reservation ID: ${newBooking._id.slice(-6)}`,
      });
      setStartDate('');
      setEndDate('');
      setBookingLoading(false);
    }, 600);
  };

  const handleCreateListing = (e) => {
    e.preventDefault();
    const created = {
      _id: 'cust_' + Date.now(),
      title: newListing.title,
      description: newListing.description,
      category: newListing.category,
      location: newListing.location,
      pricePerNight: Number(newListing.pricePerNight),
      maxGuests: Number(newListing.maxGuests),
      ratingsAverage: 5.0,
      host: { name: user?.name || 'Local Host' },
      images: [
        newListing.imageUrl1.trim() || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
        newListing.imageUrl2.trim() || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      ],
      locationGeo: {
        type: 'Point',
        coordinates: [Number(newListing.longitude), Number(newListing.latitude)],
      },
    };

    setListings([created, ...listings]);
    setShowHostModal(false);
    alert('Your stay is now published live!');
  };

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

  const getCoordinates = (listing) => {
    if (
      listing?.locationGeo?.coordinates?.length === 2 &&
      (listing.locationGeo.coordinates[0] !== 0 || listing.locationGeo.coordinates[1] !== 0)
    ) {
      return [listing.locationGeo.coordinates[1], listing.locationGeo.coordinates[0]];
    }
    return [9.9312, 76.2673];
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span
            onClick={() => setShowHostModal(true)}
            style={{
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              color: '#222222',
              padding: '8px 12px',
              borderRadius: '20px'
            }}
          >
            Airbnb your home
          </span>

          <button
            type="button"
            onClick={() => setShowBookingsModal(true)}
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
            My Bookings ({myBookings.length})
          </button>
        </div>
      </header>

      {/* 2. Main Content Area */}
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
            ★ {selectedListing.ratingsAverage?.toFixed(1) || '4.9'} ({reviews.length} reviews) · <span style={{ textDecoration: 'underline', fontWeight: '500' }}>{selectedListing.location}</span>
          </p>

          {/* Photo Gallery */}
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
                src={selectedListing.images[0]}
                alt="Main View"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
              <div style={{ flex: '1', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={selectedListing.images[1] || selectedListing.images[0]}
                  alt="Angle 2"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ flex: '1', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={selectedListing.images[2] || selectedListing.images[0]}
                  alt="Angle 3"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>
          </div>

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

              {/* Map */}
              <div style={{ padding: '28px 0', borderBottom: '1px solid #ebebeb' }}>
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
                      attribution='&copy; OpenStreetMap contributors'
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

              {/* Reviews */}
              <div style={{ padding: '28px 0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 20px 0' }}>
                  ★ {selectedListing.ratingsAverage?.toFixed(1) || '4.9'} · {reviews.length} Reviews
                </h3>

                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  marginBottom: '28px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Leave a Review</h4>

                  {reviewFeedback && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      marginBottom: '12px',
                      backgroundColor: '#ecfdf5',
                      color: '#047857'
                    }}>
                      {reviewFeedback.msg}
                    </div>
                  )}

                  <form onSubmit={handleReviewSubmit}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563' }}>Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: star <= reviewRating ? '#f59e0b' : '#d1d5db',
                            padding: '0 2px'
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <textarea
                      required
                      rows="3"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share details of your experience..."
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />

                    <button
                      type="submit"
                      style={{
                        marginTop: '10px',
                        padding: '8px 18px',
                        backgroundColor: '#222222',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Submit Review
                    </button>
                  </form>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {reviews.map((r) => (
                    <div key={r._id} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          color: '#4b5563'
                        }}>
                          {r.user?.name ? r.user.name[0].toUpperCase() : 'G'}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                            {r.user?.name || 'Guest'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {'★'.repeat(r.rating)} · {new Date(r.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                        {r.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Reservation Widget */}
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
                  ★ {selectedListing.ratingsAverage?.toFixed(1) || '4.9'}
                </span>
              </div>

              {bookingFeedback && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  backgroundColor: bookingFeedback.type === 'success' ? '#ecfdf5' : '#fee2e2',
                  color: bookingFeedback.type === 'success' ? '#047857' : '#b91c1c',
                  border: `1px solid ${bookingFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                }}>
                  <b>{bookingFeedback.type === 'success' ? '✓ ' : '✕ '}</b>
                  {bookingFeedback.msg}
                </div>
              )}

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
                    cursor: 'pointer'
                  }}
                >
                  {bookingLoading ? 'Reserving...' : 'Reserve'}
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
                      src={item.images[0]}
                      alt={item.title}
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
                        {item.location}
                      </h3>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#222222' }}>
                        ★ {item.ratingsAverage?.toFixed(1) || '4.9'}
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
          </main>
        </>
      )}

      {/* Host Publishing Modal */}
      {showHostModal && (
        <div
          onClick={() => setShowHostModal(false)}
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
              maxWidth: '520px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Airbnb Your Home</h2>
              <button onClick={() => setShowHostModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateListing} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                required
                placeholder="Stay Title"
                value={newListing.title}
                onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
              <textarea
                required
                rows="2"
                placeholder="Description"
                value={newListing.description}
                onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select
                  value={newListing.category}
                  onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff' }}
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="City / Location"
                  value={newListing.location}
                  onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="number"
                  required
                  placeholder="Price / Night (₹)"
                  value={newListing.pricePerNight}
                  onChange={(e) => setNewListing({ ...newListing, pricePerNight: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
                <input
                  type="number"
                  required
                  placeholder="Max Guests"
                  value={newListing.maxGuests}
                  onChange={(e) => setNewListing({ ...newListing, maxGuests: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>
              <input
                type="url"
                placeholder="Photo URL (Optional)"
                value={newListing.imageUrl1}
                onChange={(e) => setNewListing({ ...newListing, imageUrl1: e.target.value })}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
              <button
                type="submit"
                style={{
                  padding: '12px',
                  backgroundColor: '#FF385C',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Publish Stay
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bookings Modal */}
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
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Your Reservations</h2>
              <button onClick={() => setShowBookingsModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            {myBookings.length === 0 ? (
              <p style={{ color: '#717171', textAlign: 'center', margin: '30px 0' }}>No trips booked yet.</p>
            ) : (
              myBookings.map((b) => (
                <div key={b._id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '12px', backgroundColor: '#f9fafb' }}>
                  <b style={{ fontSize: '15px' }}>{b.listing?.title}</b>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>📍 {b.listing?.location} · {b.guests} guest(s)</p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>📅 {b.startDate} &rarr; {b.endDate}</p>
                  <p style={{ margin: '6px 0 0 0', fontWeight: 'bold' }}>Total: ₹{b.totalPrice?.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}