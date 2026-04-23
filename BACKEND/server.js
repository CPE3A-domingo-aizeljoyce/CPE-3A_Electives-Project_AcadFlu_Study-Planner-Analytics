import 'dotenv/config';
import express   from 'express';
import cors      from 'cors';
import helmet    from 'helmet';
import connectDB from './config/db.js';
import authRoutes          from './routes/authRoutes.js';
import goalRoutes          from './routes/goalRoutes.js';
import taskRoutes          from './routes/taskRoutes.js';
import timerRoutes         from './routes/timerRoutes.js';
import noteRoutes          from './routes/notesRoutes.js';
import achievementsRoutes  from './routes/achievementsRoutes.js';
import settingsRoutes      from './routes/settingsRoutes.js';

connectDB();

const app = express();

app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
}));

app.use(cors({
  origin:         process.env.CLIENT_URL || 'http://localhost:5173',
  credentials:    true,
  exposedHeaders: ['X-Calendar-Sync'],
}));

app.use(express.json({ limit: '10kb' }));

app.use('/api/auth',         authRoutes);
app.use('/api/goals',        goalRoutes);
app.use('/api/tasks',        taskRoutes);
app.use('/api/study-timer',  timerRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/notes',        noteRoutes);
app.use('/api/settings',     settingsRoutes);

app.get('/', (req, res) => res.send('AcadFlu API is running ✅'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
