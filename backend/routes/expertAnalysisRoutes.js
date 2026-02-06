const express = require('express');
const router = express.Router();
const {
  getExpertAnalysis,
  saveExpertAnalysis,
  getEditHistory,
  getHistoryEntry,
  getTransmissionInterconnection,
  saveTransmissionInterconnection
} = require('../controllers/expertAnalysisController');

const { authenticateToken: protect } = require('../middleware/auth');

// Expert Analysis Routes
router.get('/expert-analysis', protect, getExpertAnalysis);
router.post('/expert-analysis', protect, saveExpertAnalysis);

// Edit History Routes (NEW - Option B)
router.get('/expert-analysis/history', protect, getEditHistory);
router.get('/expert-analysis/history/:historyId', protect, getHistoryEntry);

// Transmission Interconnection Routes
router.get('/transmission-interconnection', protect, getTransmissionInterconnection);
router.post('/transmission-interconnection', protect, saveTransmissionInterconnection);

module.exports = router;
