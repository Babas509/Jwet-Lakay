// domino.js
// Game module placeholder. Export a simple API you can flesh out later.

module.exports = {
  name: 'domino',
  init(io) {
    // Initialize game sockets/channels
    if (io) io.emit('game:init', { game: 'domino', at: Date.now() });
  },
  placeBet(userId, payload) {
    // Validate & record a mock bet
    return { ok: true, game: 'domino', userId, payload };
  }
};
