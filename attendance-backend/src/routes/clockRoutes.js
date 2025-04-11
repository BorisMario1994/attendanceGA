const express = require('express');
const { body } = require('express-validator');
const clockController = require('../controllers/clockController');

const router = express.Router();

router.post(
    '/in',
    [
        body('code')
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('PIN code must be exactly 6 digits')
    ],
    clockController.clockIn
);

router.post(
    '/out',
    [
        body('code')
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('PIN code must be exactly 6 digits')
    ],
    clockController.clockOut
);

module.exports = router;