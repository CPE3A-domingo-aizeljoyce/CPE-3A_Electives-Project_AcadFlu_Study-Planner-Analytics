// SETTINGS ROUTES
// Manages user preferences and app settings
//
// Connected frontend:
// - Settings.jsx
//
// Uses:
// - Controller: settingsController.js
// - Model: UserSettings.js
// - Middleware: authMiddleware.js

const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, getSettings);
router.put('/', auth, updateSettings);

module.exports = router;
