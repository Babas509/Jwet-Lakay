// backend/server.js
// Minimal Express + Socket.IO bootstrap placeholder.
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Basic middleware
app.use(express.json());

// Mount placeholder routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bets', require('./routes/betRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Health
app.get('/health', (req, res) => res.json({ ok: true, at: new Date().toISOString() }));

// Static frontend (for local dev preview)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

io.on('connection', (socket) => {
  socket.emit('hello', { msg: 'Socket connected', at: Date.now() });
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 8080;
if (require.main === module) {
  server.listen(PORT, () => console.log(`Placeholder server listening on ${PORT}`));
}

module.exports = { app, server, io };
