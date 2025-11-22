import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware } from '../auth';

const router = Router();

// GET /api/cards/:id - simplified translation of get-card-details
router.get('/:id', authMiddleware, async (req, res) => {
  const cardId = req.params.id;
  const user = (req as any).user;
  try {
    const [rows] = await pool.query('SELECT * FROM strowallet_cards WHERE card_id = ? AND user_id = ?', [cardId, user.userId]);
    const cards = rows as any[];
    if (!cards.length) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    // TODO: Call external Strowallet API and update DB similar to Supabase function
    return res.json({ success: true, card: cards[0] });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
