import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
const JWT_SECRET = 'my_jwt_secret_key_12345';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
// Self-contained MongoDB instance
async function startServer() {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully (in-memory test database).');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
  }
}

startServer();
// ==========================================
// 1. DATA MODELS (MODULE 1)
// ==========================================

// User Schema (Guests and Hosts)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['guest', 'host', 'admin'], default: 'guest' }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

// Listing Schema
const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // e.g. Beachfront, Cabins, Iconic cities
  location: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  pricePerNight: { type: Number, required: true },
  maxGuests: { type: Number, required: true },
  images: [{ type: String }],
  amenities: [{ type: String }],
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

export const Listing = mongoose.model('Listing', listingSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalNights: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
}, { timestamps: true });

export const Booking = mongoose.model('Booking', bookingSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);

// ==========================================
// 2. AUTHENTICATION & ROLE MIDDLEWARE
// ==========================================

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: `Access denied. Requires ${role} role.` });
    }
    next();
  };
};

// ==========================================
// 3. AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'guest'
    });

const token =  jwt.sign(
  { id: newUser._id, email: newUser.email, role: newUser.role },
  JWT_SECRET,
  { expiresIn: '7d' }
);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

const token = jwt.sign(
  { id: user._id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: '7d' }
);


    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Check current user profile (Protected route test)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Root health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Airbnb clone API is active.' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


// ==========================================
// 4. LISTING ROUTES (FOUNDATION FOR DAYS 3 & 4)
// ==========================================

// Create Listing (Host only)
app.post('/api/listings', verifyToken, requireRole('host'), async (req, res) => {
  try {
    const { title, description, category, location, coordinates, pricePerNight, maxGuests, images, amenities } = req.body;

    const listing = await Listing.create({
      title,
      description,
      category,
      location,
      coordinates: coordinates || { lat: 0, lng: 0 },
      pricePerNight,
      maxGuests,
      images: images || [],
      amenities: amenities || [],
      host: req.user.id
    });

    res.status(201).json({ message: 'Listing created successfully', listing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create listing', error: err.message });
  }
});

// Get All Listings with Search & Price Filters (Public)
app.get('/api/listings', async (req, res) => {
  try {
    const { location, category, minPrice, maxPrice } = req.query;
    let query = {};

    if (location) query.location = { $regex: location, $options: 'i' };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(query).populate('host', 'name email');
    res.status(200).json({ count: listings.length, listings });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listings', error: err.message });
  }
});

// Get Single Listing (Public)
app.get('/api/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('host', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.status(200).json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving listing', error: err.message });
  }
});

// ==========================================
// 5. DAY 3: BOOKINGS & RESERVATIONS ENGINE
// ==========================================

// Create a Booking with Overlap Protection (Protected)
app.post('/api/bookings', verifyToken, async (req, res) => {
  try {
    const { listingId, startDate, endDate } = req.body;

    if (!listingId || !startDate || !endDate) {
      return res.status(400).json({ message: 'listingId, startDate, and endDate are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (totalNights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Overlap validation: newStart < existingEnd && newEnd > existingStart
    const conflict = await Booking.findOne({
      listing: listingId,
      status: 'confirmed',
      startDate: { $lt: end },
      endDate: { $gt: start }
    });

    if (conflict) {
      return res.status(409).json({ message: 'Listing is already reserved for the selected dates.' });
    }

    const totalPrice = totalNights * listing.pricePerNight;

    const booking = await Booking.create({
      listing: listingId,
      guest: req.user.id,
      startDate: start,
      endDate: end,
      totalNights,
      totalPrice,
      status: 'confirmed'
    });

    res.status(201).json({
      message: 'Booking confirmed successfully',
      booking
    });
  } catch (err) {
    res.status(500).json({ message: 'Booking failed', error: err.message });
  }
});

// Get Current User's Bookings (Protected)
app.get('/api/bookings/my-bookings', verifyToken, async (req, res) => {
  try {
    const userBookings = await Booking.find({ guest: req.user.id })
      .populate('listing', 'title location pricePerNight images')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: userBookings.length, bookings: userBookings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve bookings', error: err.message });
  }
});

// Cancel a Booking (Protected: User must be the guest who booked)
app.patch('/api/bookings/:id/cancel', verifyToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (booking.guest.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. You can only cancel your own booking.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    res.status(500).json({ message: 'Cancellation failed', error: err.message });
  }
});

// ==========================================
// 6. DAY 4: REVIEWS, RATINGS & HOST ANALYTICS
// ==========================================

// Add a Review & Update Listing Average Rating (Protected)
app.post('/api/reviews', verifyToken, async (req, res) => {
  try {
    const { listingId, rating, comment } = req.body;

    if (!listingId || !rating || !comment) {
      return res.status(400).json({ message: 'listingId, rating, and comment are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    const review = await Review.create({
      listing: listingId,
      author: req.user.id,
      rating: Number(rating),
      comment
    });

    // Recalculate average rating for the listing
    const allListingReviews = await Review.find({ listing: listingId });
    const avgScore = allListingReviews.reduce((sum, r) => sum + r.rating, 0) / allListingReviews.length;

    listing.rating = Number(avgScore.toFixed(1));
    listing.reviewCount = allListingReviews.length;
    await listing.save();

    res.status(201).json({ message: 'Review submitted successfully', review, updatedRating: listing.rating });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit review', error: err.message });
  }
});

// Get All Reviews for a Listing (Public)
app.get('/api/reviews/listing/:listingId', async (req, res) => {
  try {
    const reviews = await Review.find({ listing: req.params.listingId })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve reviews', error: err.message });
  }
});

// Host Analytics Dashboard (Protected: Host Only)
app.get('/api/host/dashboard', verifyToken, requireRole('host'), async (req, res) => {
  try {
    const hostListings = await Listing.find({ host: req.user.id });
    const hostListingIds = hostListings.map((l) => l._id);

    const hostBookings = await Booking.find({
      listing: { $in: hostListingIds },
      status: 'confirmed'
    });

    const totalRevenue = hostBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    res.status(200).json({
      totalListings: hostListings.length,
      activeBookingsCount: hostBookings.length,
      grossEarnings: totalRevenue,
      listings: hostListings
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load host dashboard', error: err.message });
  }
});