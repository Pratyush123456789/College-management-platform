import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { INITIAL_CAMPUS_STATE } from './src/data/campusData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory state seeded with Delhi Technical Campus (GGSIPU) data
let campusState = structuredClone(INITIAL_CAMPUS_STATE);
const demoRequests: Array<{
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  submittedAt: string;
}> = [];

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', institution: 'Delhi Technical Campus, Greater Noida' });
});

app.get('/api/campus-state', (_req, res) => {
  res.json(campusState);
});

app.put('/api/campus-state', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Invalid state payload' });
    return;
  }
  campusState = req.body;
  res.json({ ok: true });
});

app.post('/api/campus-state/reset', (_req, res) => {
  campusState = structuredClone(INITIAL_CAMPUS_STATE);
  res.json(campusState);
});

app.post('/api/demo-requests', (req, res) => {
  const { name, email, role, department } = req.body ?? {};
  if (!name || !email || !String(email).includes('@')) {
    res.status(400).json({ error: 'Valid name and institutional email are required.' });
    return;
  }
  const entry = {
    id: `demo-${Date.now()}`,
    name: String(name).trim(),
    email: String(email).trim(),
    role: String(role || 'Administration'),
    department: String(department || 'General'),
    submittedAt: new Date().toISOString(),
  };
  demoRequests.push(entry);
  res.status(201).json({ ok: true, request: entry });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DTC College Management Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
