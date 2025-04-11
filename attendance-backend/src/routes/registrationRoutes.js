const express = require('express');
const { body } = require('express-validator');
const registrationController = require('../controllers/registrationController');

const router = express.Router();

router.post(
    '/register',
    [
        body('employeeId')
            .isLength({ min: 8, max: 8 })
            .isNumeric()
            .withMessage('Employee ID must be exactly 8 digits')
    ],
    registrationController.register
);

router.post(
    '/verify',
    [
        body('employeeId')
            .isLength({ min: 8, max: 8 })
            .isNumeric()
            .withMessage('Employee ID must be exactly 8 digits'),
        body('code')
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage('Verification code must be exactly 6 digits')
    ],
    registrationController.verifyCode
);

module.exports = router;