import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  createBookValidator,
  updateBookValidator,
  publisherValidator,
  idParamValidator,
  registerReaderValidator,
  borrowBookReturnValidator,
  borrowBookUpdateValidator,
} from '../utils/validators.js';

import handleValidationErrors,{ handleValidationErrorsForSingleFile } from '../middleware/validationMiddleware.js';

import {
  getDashboardStats,
  createBook,
  updateBook,
  deleteBook,
  getAllPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
  getAllReaders,
  getReaderById,
  updateReader,
  deleteReader,
  getAllBorrowRecords,
  adminReturnBook,
  adminUpdateBorrow,
  getHotBooksReport,
  createReader,
  getTopReports
} from '../controllers/adminController.js';
// We also need the public book controller for the admin side to list books
import { getAllBooks, getBookById } from '../controllers/bookController.js';

const router = express.Router();

// --- Protect all admin routes ---
// All routes in this file require authentication AND 'admin' or 'librarian' role
router.use(requireAuth, requireRole('admin', 'librarian'));

// --- Dashboard ---
router.get('/stats', getDashboardStats);

// --- Book Management ---
router.post(
  '/sach',
  upload.single('coverImage'), // 'coverImage' must match form field name
  createBookValidator,
  handleValidationErrorsForSingleFile,
  createBook
);
router.put(
  '/sach/:id',
  upload.single('coverImage'),
  updateBookValidator,
  handleValidationErrorsForSingleFile,
  updateBook
);
router.delete('/sach/:id', idParamValidator, handleValidationErrors, deleteBook);
// Admin also needs to get books (can reuse public controller)
router.get('/sach', getAllBooks);
router.get('/sach/:id', idParamValidator, handleValidationErrors, getBookById);

// --- Publisher Management ---
router.get('/nxb', getAllPublishers);
router.post(
  '/nxb',
  publisherValidator,
  handleValidationErrors,
  createPublisher
);
router.put(
  '/nxb/:id',
  idParamValidator,
  publisherValidator,
  handleValidationErrors,
  updatePublisher
);
router.delete('/nxb/:id', idParamValidator, handleValidationErrors, deletePublisher);

// --- Reader (Docgia) Management ---
router.get('/docgia', getAllReaders);
router.get('/docgia/:id', idParamValidator, handleValidationErrors, getReaderById);
router.put('/docgia/:id', idParamValidator, handleValidationErrors, updateReader);
router.delete('/docgia/:id', idParamValidator, handleValidationErrors, deleteReader);
router.post('/docgia',registerReaderValidator, handleValidationErrors, createReader);

// --- Borrow (Muon) Management ---
router.get('/muon', getAllBorrowRecords);
router.put(
  '/muon/:id/return',
  borrowBookReturnValidator,
  handleValidationErrors,
  adminReturnBook
);
router.put(
  '/muon/:id',
  borrowBookUpdateValidator,
  handleValidationErrors,
  adminUpdateBorrow
);

// --- Reports ---
router.get('/report/hot-books', getHotBooksReport);
router.get('/report/top', getTopReports);

export default router;