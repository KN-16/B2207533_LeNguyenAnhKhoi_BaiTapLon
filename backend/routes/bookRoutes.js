import express from 'express';
import {
  getAllBooks,
  getBookById,
  getHotBooks,
  getAllBooksReader,
} from '../controllers/bookController.js';
import { getAllPublishers } from '../controllers/adminController.js';
import { idParamValidator } from '../utils/validators.js';
import handleValidationErrors from '../middleware/validationMiddleware.js';

const router = express.Router();

router.get('/nxb', getAllPublishers);

router.get('/', getAllBooks);
router.get('/reader', getAllBooksReader);
router.get('/hot', getHotBooks);
router.get('/:id', idParamValidator, handleValidationErrors, getBookById);



export default router;