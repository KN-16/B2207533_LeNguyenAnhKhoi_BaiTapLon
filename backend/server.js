import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Core Middleware ---

// CORS Configuration
const corsOptions = {
  origin: [process.env.CLIENT_ORIGIN_USER, process.env.CLIENT_ORIGIN_ADMIN],
  credentials: true,
};
app.use(cors(corsOptions));

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
// JSON Parsing
app.use(express.json());

// URL-encoded data parsing
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Sanitize MongoDB inputs
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// --- Static Asset Handling ---

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files statically
// /uploads will be accessible via /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api', apiRoutes);

// --- Not Found and Error Handling ---
app.use(notFound);
app.use(errorHandler);

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});