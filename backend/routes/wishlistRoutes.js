import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, updateQty, createBorrowFromWishlist } from '../controllers/wishlistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth); // Tất cả đều cần đăng nhập

router.get('/', getWishlist);
router.post('/add', addToWishlist);
router.post('/muon', createBorrowFromWishlist);
router.put('/:bookId', updateQty);
router.delete('/:bookId', removeFromWishlist);

export default router;