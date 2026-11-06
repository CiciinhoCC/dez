// api.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { verifyToken } = require('./authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

// ============================================================
// AUTH
// ============================================================

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be 3–50 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?', [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    const token = jwt.sign(
      { id: result.insertId, username, role: 'user' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: { id: result.insertId, username, role: 'user' },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// NOTES
// ============================================================

// GET /api/notes/subjects  (must come BEFORE /notes/:id)
router.get('/notes/subjects', verifyToken, async (req, res) => {
  try {
    let sql;
    const params = [];

    if (req.user.role === 'admin') {
      // Admin sees every subject that exists
      sql = 'SELECT DISTINCT subject FROM notes ORDER BY subject';
    } else {
      // Normal user sees subjects from their own notes + public notes
      sql = 'SELECT DISTINCT subject FROM notes WHERE user_id = ? OR is_public = 1 ORDER BY subject';
      params.push(req.user.id);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows.map(r => r.subject));
  } catch (err) {
    console.error('Subjects error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/notes?scope=all|mine|public&subject=...&q=...
router.get('/notes', verifyToken, async (req, res) => {
  try {
    const { scope = 'all', subject, q } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let sql = `
      SELECT n.id, n.user_id, n.title, n.subject, n.content,
             n.is_public, n.created_at, n.updated_at,
             u.username AS author
      FROM notes n
      JOIN users u ON u.id = n.user_id
      WHERE 1 = 1
    `;
    const params = [];

    // --- SCOPE ---
    if (scope === 'mine') {
      sql += ' AND n.user_id = ?';
      params.push(userId);
    } else if (scope === 'public') {
      sql += ' AND n.is_public = 1';
    } else {
      // scope = 'all'
      if (isAdmin) {
        // Admin: everything, no restriction
      } else {
        // Normal user: my notes OR public notes
        sql += ' AND (n.user_id = ? OR n.is_public = 1)';
        params.push(userId);
      }
    }

    if (subject) {
      sql += ' AND n.subject = ?';
      params.push(subject);
    }

    if (q) {
      sql += ' AND (n.title LIKE ? OR n.content LIKE ? OR u.username LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    sql += ' ORDER BY n.updated_at DESC LIMIT 200';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('List notes error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/notes/:id
router.get('/notes/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, u.username AS author
         FROM notes n JOIN users u ON u.id = n.user_id
         WHERE n.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Note not found.' });

    const note = rows[0];
    const isOwner = note.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin && !note.is_public) {
      return res.status(403).json({ error: 'Not allowed.' });
    }
    res.json(note);
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================================
// NOTES — write operations
// ============================================================

// POST /api/notes  — create a note
router.post('/notes', verifyToken, async (req, res) => {
  try {
    const { title, subject, content, is_public } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    if (title.length > 150) {
      return res.status(400).json({ error: 'Title must be ≤150 characters.' });
    }
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required.' });
    }
    if (content && content.length > 16000000) {
      return res.status(400).json({ error: 'note too big :(' });
    }
    if (subject && subject.length > 50) {
      return res.status(400).json({ error: 'Subject must be ≤50 characters.' });
    }

    const finalSubject = (subject && subject.trim()) || 'General';
    const finalPublic = is_public ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO notes (user_id, title, subject, content, is_public)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, title.trim(), finalSubject, content, finalPublic]
    );

    // Return the created note so the client doesn't need a second fetch
    const [rows] = await pool.query(
      `SELECT n.*, u.username AS author
         FROM notes n JOIN users u ON u.id = n.user_id
         WHERE n.id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/notes/:id  — update a note (owner or admin only)
router.put('/notes/:id', verifyToken, async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, subject, content, is_public } = req.body;

    // Fetch the existing note first so we can check ownership
    const [existing] = await pool.query(
      'SELECT id, user_id FROM notes WHERE id = ?',
      [noteId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const isOwner = existing[0].user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not allowed.' });
    }

    // Validate any provided fields
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title cannot be empty.' });
      }
      if (title.length > 150) {
        return res.status(400).json({ error: 'Title must be ≤150 characters.' });
      }
    }
    if (subject !== undefined && subject.length > 50) {
      return res.status(400).json({ error: 'Subject must be ≤50 characters.' });
    }
    if (content !== undefined && (typeof content !== 'string' || content.length === 0)) {
      return res.status(400).json({ error: 'Content cannot be empty.' });
    }

    // Build a partial update dynamically (only fields the client sent)
    const updates = [];
    const params = [];
    if (title !== undefined)   { updates.push('title = ?');     params.push(title.trim()); }
    if (subject !== undefined) { updates.push('subject = ?');   params.push(subject.trim() || 'General'); }
    if (content !== undefined) { updates.push('content = ?');   params.push(content); }
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      params.push(is_public ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    // updated_at auto-bumps via ON UPDATE CURRENT_TIMESTAMP
    params.push(noteId);
    await pool.query(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Return the fresh row
    const [rows] = await pool.query(
      `SELECT n.*, u.username AS author
         FROM notes n JOIN users u ON u.id = n.user_id
         WHERE n.id = ?`,
      [noteId]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/notes/:id  — delete a note (owner or admin only)
router.delete('/notes/:id', verifyToken, async (req, res) => {
  try {
    const noteId = req.params.id;

    const [existing] = await pool.query(
      'SELECT id, user_id FROM notes WHERE id = ?',
      [noteId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const isOwner = existing[0].user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not allowed.' });
    }

    await pool.query('DELETE FROM notes WHERE id = ?', [noteId]);
    res.status(204).end(); // 204 No Content = success, nothing to return
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;