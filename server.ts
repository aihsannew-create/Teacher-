import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { authMiddleware } from './server/auth';
import authRoutes from './server/routes/auth';
import classesRoutes from './server/routes/classes';
import studentsRoutes from './server/routes/students';
import homeworkRoutes from './server/routes/homework';
import paymentsRoutes from './server/routes/payments';
import attendanceRoutes from './server/routes/attendance';
import reportsRoutes from './server/routes/reports';
import settingsRoutes from './server/routes/settings';
import ownerRoutes from './server/routes/owner';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global auth token parser
  app.use(authMiddleware);

  // Mount API routers
  app.use('/api/auth', authRoutes);
  app.use('/api/owner', ownerRoutes);
  app.use('/api/classes', classesRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/homework', homeworkRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/settings', settingsRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Prerna Tuition OS API', time: new Date().toISOString() });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
