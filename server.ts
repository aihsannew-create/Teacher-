import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './server/auth.ts';
import authRoutes from './server/routes/auth.ts';
import classesRoutes from './server/routes/classes.ts';
import studentsRoutes from './server/routes/students.ts';
import homeworkRoutes from './server/routes/homework.ts';
import paymentsRoutes from './server/routes/payments.ts';
import attendanceRoutes from './server/routes/attendance.ts';
import reportsRoutes from './server/routes/reports.ts';
import settingsRoutes from './server/routes/settings.ts';
import ownerRoutes from './server/routes/owner.ts';
import inquiriesRoutes from './server/routes/inquiries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Global auth token parser
  app.use('/api', (_req, res, next) => {
    res.setHeader('X-Prerna-Api', '1');
    next();
  });
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
  app.use('/api/inquiries', inquiriesRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Prerna Tuition OS API', time: new Date().toISOString() });
  });

  // Vite middleware in dev or static files in production
  const distPath = path.resolve(__dirname, 'dist');
  const distIndex = path.join(distPath, 'index.html');
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      if (fs.existsSync(distIndex)) {
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          res.sendFile(distIndex);
        });
      } else {
        throw viteErr;
      }
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
