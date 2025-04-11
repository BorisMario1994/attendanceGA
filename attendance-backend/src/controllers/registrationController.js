const speakeasy = require('speakeasy');
const { validationResult } = require('express-validator');
const { pool, poolConnect } = require('../config/db');

exports.register = async (req, res) => {
    try {
        await poolConnect;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { employeeId } = req.body;

        // Check if employee already exists
        const result = await pool.request()
            .input('employeeId', employeeId)
            .query('SELECT employee_id FROM employees_GA WHERE employee_id = @employeeId');

        if (result.recordset.length > 0) {
            return res.status(400).json({
                error: 'Employee ID already registered'
            });
        }

        // Generate new TOTP secret with unique parameters per employee
        const secret = speakeasy.generateSecret({
            length: 32, // Increased length for more uniqueness
            name: `AttendanceSystem-${employeeId}`, // Make name unique per employee
            issuer: `AttendanceGA-${employeeId.substring(0, 4)}`, // Add employee-specific issuer
            encoding: 'base32',
            period: 30, // TOTP refresh period in seconds
            digits: 6,
            algorithm: 'sha512' // Using stronger algorithm
        });

        // Save to database
        await pool.request()
            .input('employeeId', employeeId)
            .input('otpSecret', secret.base32)
            .query('INSERT INTO employees_GA (employee_id, otp_secret) VALUES (@employeeId, @otpSecret)');

        // Return the secret and otpauth URL for QR code
        res.json({
            success: true,
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url,
            employeeId: employeeId,
            message: 'Please scan this unique QR code. Do not share it with others.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};

exports.verifyCode = async (req, res) => {
    try {
        await poolConnect;
        const { employeeId, code } = req.body;

        // Get the secret from database
        const result = await pool.request()
            .input('employeeId', employeeId)
            .query('SELECT otp_secret FROM employees_GA WHERE employee_id = @employeeId');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                error: 'Employee not found'
            });
        }

        const secret = result.recordset[0].otp_secret;

        // Verify the code
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: code,
            window: 0 // Allow 30 seconds window
        });

        res.json({
            success: verified,
            message: verified ? 'Code verification successful' : 'Invalid code'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
};