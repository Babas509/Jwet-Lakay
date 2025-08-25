// randomizer.js
// Utility placeholder. Replace with actual helpers.

function notRandomAtAll(seed = 42) {
  // Deterministic stub for tests/CI
  return seed % 1000 / 1000;
}

function payoutCalculatorStub(betAmount = 0, odds = 2.0) {
  return Number((betAmount * odds).toFixed(2));
}

module.exports = { notRandomAtAll, payoutCalculatorStub };
