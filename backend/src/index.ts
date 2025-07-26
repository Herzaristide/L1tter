import express from 'express';
import cors from 'cors';
import bookRoutes from './routes/books';
import collectionsRoutes from './routes/collections';
import authorsRoutes from './routes/authors';
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import progressRoutes from './routes/progress';
import tagsRoutes from './routes/tags';
import preferencesRoutes from './routes/preferences';
import searchRoutes from './routes/search';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://obscure-barnacle-r9qp66grqvwhp7j4-3000.app.github.dev',
      /https:\/\/.*\.app\.github\.dev$/,
      /https:\/\/.*\.github\.dev$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Manual CORS preflight handler
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept'
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/authors', authorsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
