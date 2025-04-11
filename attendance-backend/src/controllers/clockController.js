const speakeasy = require('speakeasy');
const { pool, poolConnect } = require('../config/db');

const verifyEmployeeAndCode = async (code) => {
    await poolConnect;
    
    // Get all employees and verify the code against each one
    const result = await pool.request()
        .query('SELECT employee_id, otp_secret FROM employees_GA');

    for (const employee of result.recordset) {
        const verified = speakeasy.totp.verify({
            secret: employee.otp_secret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (verified) {
            return employee.employee_id;
        }
    }
    
    return null;
};

exports.clockIn = async (req, res) => {
    try {
        const { code } = req.body;

        const employeeId = await verifyEmployeeAndCode(code);
        if (!employeeId) {
            return res.status(401).json({ error: 'Invalid PIN code' });
        }

        // Create new attendance record - no validation check needed
        await pool.request()
            .input('employeeId', employeeId)
            .query(`
                INSERT INTO attendance_records (employee_id, stat)
                VALUES (@employeeId, 'clockin')
            `);

        res.json({ 
            success: true, 
            employeeId,
            message: 'Clock in successful' 
        });

    } catch (error) {
        console.error('Clock in error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.clockOut = async (req, res) => {
    try {
        const { code } = req.body;

        const employeeId = await verifyEmployeeAndCode(code);
        if (!employeeId) {
            return res.status(401).json({ error: 'Invalid PIN code' });
        }

        // Create clock out record - no validation check needed
        await pool.request()
            .input('employeeId', employeeId)
            .query(`
                INSERT INTO attendance_records (employee_id, stat)
                VALUES (@employeeId, 'clockout')
            `);

        res.json({ 
            success: true, 
            employeeId,
            message: 'Clock out successful' 
        });

    } catch (error) {
        console.error('Clock out error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};