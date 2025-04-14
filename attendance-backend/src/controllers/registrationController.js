const { pool, poolConnect } = require('../config/db');
const { authenticator } = require('otplib');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// Configure authenticator
authenticator.options = { 
  digits: 6,
  step: 30
};

const registerEmployee = async (req, res) => {
  const { employeeId, photo } = req.body;

  if (!employeeId || !photo) {
    return res.status(400).json({ error: 'Employee ID and photo are required' });
  }

  try {
    await poolConnect;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if employee already exists
    const result = await pool.request()
      .input('employeeId', employeeId)
      .query('SELECT employee_id FROM employees_GA WHERE employee_id = @employeeId');

    if (result.recordset.length > 0) {
      return res.status(400).json({
        error: 'Employee ID already registered'
      });
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    
    // Create TOTP URL for QR code using authenticator
    const otpauthUrl = authenticator.keyuri(employeeId, 'HOCK', secret);

    // Insert employee data with photo
    const query = `
      INSERT INTO employees_GA (employee_id, otp_secret, photo)
      VALUES (@employeeId, @secret, @photo)
    `;

    const request = pool.request()
      .input('employeeId', employeeId)
      .input('secret', secret)
      .input('photo', photo);

    await request.query(query);

    res.json({ 
      success: true, 
      message: 'Registration successful',
      otpauthUrl 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
};

const verifyCode = async (req, res) => {
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

    // Verify the code using authenticator
    const verified = authenticator.verify({
      token: code,
      secret: secret
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

module.exports = {
  registerEmployee,
  verifyCode
};