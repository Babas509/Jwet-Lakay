# Jwet Lakay — Pro 🎮

**Jwet Lakay** is a Haitian-themed web gaming and social-commerce platform.  
It combines casual games, quizzes, marketplace items, VIP memberships, daily rewards, and community features into one **progressive web app (PWA)**.

This project is designed as a prototype frontend (HTML/CSS/JS) with wallet logic, mini-games, chat/rooms, and VIP tiers.

---

## 🌟 Features

- **🎮 Game Arena**
  - Play quick matches or challenge other players.
  - Supported games: Ludo, Domino, Chess, Checkers, Racing, Bowling, Soccer, Blackjack, Bingo, Monopoly, Sudoku, etc.
  - Wager system (HTG credits) for competitive matches.

- **🧠 Quiz Arena (Gayan Lakay)**
  - Answer timed quizzes in Kreyòl and English.
  - Categories include Math, Science, History, Civics, Literature, Computer Science, Business, etc.
  - Betting and odds system: wager credits to win multipliers.

- **📚 Courses**
  - Academic categories (Math, Science, Technology, Arts, Business, Health, etc.).
  - Supports quiz seeding and learning paths.

- **🛒 Marketplace**
  - Buy cosmetic items (e.g., card backs) or functional passes (e.g., VIP Day Pass).
  - Inventory management.

- **💎 VIP Club**
  - Bronze, Silver, Gold, Platinum, Diamond tiers.
  - Perks: spin bonuses, VIP lounge, tournaments, exclusive rewards.
  - Auto-renew and cancel membership controls.

- **🎡 Daily Spin**
  - Spin for random daily rewards.

- **🏆 Leaderboard**
  - Displays wins, ELO, and rankings.

- **📊 Stats**
  - Tracks games played, win rate, best streaks.
  - Wallet trends with chart visualization.

- **🎖 Achievements**
  - Unlock badges for milestones (e.g., first win, VIP upgrade, streaks).

- **⚙️ Settings**
  - Profile management, notifications, language (English/Kreyòl), theme toggle.
  - Local encryption for wallet and transactions.
  - Data import/export.
  - Reset application.

- **💰 Wallet & 📑 Transactions**
  - Manage HTG balance, deposits, and withdrawals.
  - Supports card, mobile money, MonCash, and banks.
  - Transaction filtering and CSV export.

- **🎁 Login Rewards**
  - Daily streak bonuses with increasing prizes.

- **🤝 Affiliate Program**
  - Generate referral links and earn from invited users.

- **💬 Rooms & 🥇 Tournaments**
  - Create/join chat rooms with presence, typing, polls, pins, and file sharing.
  - Audio, video, and screen-share calls.
  - Tournament bracket generator.

- **🛡 Admin Console**
  - Inspect storage, toggle A/B flags, debug features.

- **📱 Progressive Web App (PWA)**
  - Installable on mobile and desktop.
  - Offline support with Service Worker.
  - Dynamic manifest.

---

## 🛠 Tech Stack

- **Frontend**:  
  - HTML5, CSS3 (custom dark/light theme), Vanilla JS (ES6+).
  - LocalStorage for state persistence.
  - Canvas API for stats chart.
  - Web APIs: BroadcastChannel, WebRTC, MediaRecorder, PaymentRequest, Clipboard, Notifications, Service Workers.

- **Backend (planned/optional)**:  
  - Node.js / Express for real-time multiplayer and persistent data.
  - MongoDB for storage.
  - Socket.IO for rooms and game state sync.

---

## 🚀 Getting Started

1. Clone or download this repository.
2. Open `index.html` in your browser to preview the frontend.
3. (Optional) Serve with a local web server:
   ```bash
   npx serve .
