import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { DRIVER } from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'hearthask', driver: DRIVER })
);
app.use('/api', routes);

const dist = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 4002);
app.listen(port, () => {
  console.log(`[hearthask] API        http://localhost:${port}/api`);
  console.log(`[hearthask] DB driver  ${DRIVER}`);
  if (fs.existsSync(dist)) console.log(`[hearthask] Frontend   http://localhost:${port}/`);
});
