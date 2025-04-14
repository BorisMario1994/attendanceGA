const express = require('express');
const { body } = require('express-validator');
const clockController = require('../controllers/clockController');

const router = express.Router();

// Unified clock in/out route with validation
router.post('/:type', 
    body('code')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('PIN code must be exactly 6 digits'),
    clockController.handleClockInOut
);

// Photo capture route
router.post('/:type/photo', clockController.saveAttendancePhoto);

module.exports = router;