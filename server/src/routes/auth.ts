import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { signToken } from '../auth';

const router = Router();

// POST /api/auth/register {email,password}
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/auth/login {email,password}
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' });
  try {
    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE email = ?', [email]);
    const users = rows as any[];
    if (!users.length) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const token = signToken({ userId: String(user.id), email });
    return res.json({ success: true, token });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
