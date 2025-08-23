// betRoutes.js
// Express Router placeholder routes.
// Replace with real routes and middleware.

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, route: 'betRoutes.js', at: new Date().toISOString() });
});

module.exports = router;
