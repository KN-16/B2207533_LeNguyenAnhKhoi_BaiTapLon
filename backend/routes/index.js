import express from 'express';
import authRoutes from './authRoutes.js';
import bookRoutes from './bookRoutes.js';
import borrowRoutes from './borrowRoutes.js';
import adminRoutes from './adminRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/sach', bookRoutes); // Public book routes
router.use('', borrowRoutes); // User borrow routes (e.g., /muon, /tra)
router.use('/admin', adminRoutes); // All admin routes
router.use('/wishlist', wishlistRoutes);

// Simple health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

export default router;