import express    from 'express';
import dotenv     from 'dotenv';
import cors       from 'cors';
import helmet     from 'helmet';
import connectDB  from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
connectDB();

const app = express();

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // prevent large payload attacks

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('StudyFlow API is running ✅'));

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));