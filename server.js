import express from 'express';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { addScore, listScores } from './server/scores.js';
import { authRoutes } from './server/auth.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;
const dist = path.join(root, 'dist');

app.use(express.json());
app.set('trust proxy', 1);
authRoutes(app);

app.get('/api/scores', async (_req, res) => {
  try {
    res.json(await listScores());
  } catch (error) {
    res.status(500).json({ error: 'No se pudieron leer los puntajes' });
  }
});

app.post('/api/scores', async (req, res) => {
  try {
    res.status(201).json(await addScore(req.body || {}));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo guardar el puntaje' });
  }
});

if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(port, () => {
  const store = process.env.DATABASE_URL ? 'Postgres' : 'data/scores.json';
  console.log(`Buensoft Zap en http://localhost:${port} · puntajes en ${store}`);
});
