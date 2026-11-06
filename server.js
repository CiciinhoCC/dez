// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Single router serves both /api/auth/* and /api/notes/*
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'dez_notas API' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});