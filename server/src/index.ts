import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cardsRoute from './routes/cards';
import authRoute from './routes/auth';
import { ping } from './db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await ping();
    res.json({ status: 'ok', time: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

app.use('/api/auth', authRoute);
app.use('/api/cards', cardsRoute);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
