const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.post('/login', [
    body('username').notEmpty().trim(),
    body('password').notEmpty()
], adminController.login);

router.get('/face-comparison', adminController.getFaceComparisonResults);

module.exports = router;