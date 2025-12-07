import express from 'express';
import {
  createBorrow,
  returnBook,
  getMyBorrows,
  cancelBorrowByUser
} from '../controllers/borrowController.js';
import { borrowBookValidator, idParamValidator } from '../utils/validators.js';
import handleValidationErrors from '../middleware/validationMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Routes for authenticated users (readers)
router.use(requireAuth);

router.get(
  '/muon',
  requireRole('reader'), // Only readers can see "my" borrows
  getMyBorrows
);

router.post(
  '/muon',
  requireRole('reader', 'admin'), // Only readers can borrow
  borrowBookValidator,
  handleValidationErrors,
  createBorrow
);
router.put('/muon/:id/cancel', cancelBorrowByUser);

router.put(
  '/tra/:id',
  idParamValidator,
  handleValidationErrors,
  returnBook // Logic inside controller checks for owner or admin
);



export default router;