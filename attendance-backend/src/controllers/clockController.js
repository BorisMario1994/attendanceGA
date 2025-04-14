const { pool, poolConnect } = require('../config/db');
const { authenticator } = require('otplib');

const verifyEmployeeAndCode = async (code) => {
    await poolConnect;
    
    // Get all employees and verify the code against each oness
    const result = await pool.request()
        .query('SELECT employee_id, otp_secret FROM employees_GA');

    for (const employee of result.recordset) {
        const verified = authenticator.verify({
            token: code,
            secret: employee.otp_secret
        });

        if (verified) {
            return employee.employee_id;
        }
    }
    
    return null;
};

const handleClockInOut = async (req, res) => {
    try {
        const { code } = req.body;
        const { type } = req.params;

        // Validate type parameter
        if (type !== 'in' && type !== 'out') {
            return res.status(400).json({ error: 'Type must be either "in" or "out"' });
        }

        const employeeId = await verifyEmployeeAndCode(code);
        if (!employeeId) {
            return res.status(401).json({ error: 'Invalid PIN code' });
        }

        // Create attendance record
        await pool.request()
            .input('employeeId', employeeId)
            .input('stat', type === 'in' ? 'clockin' : 'clockout')
            .query(`
                INSERT INTO attendance_records (employee_id, stat)
                VALUES (@employeeId, @stat)
            `);

        res.json({ 
            success: true, 
            employeeId,
            message: `Clock ${type} successful` 
        });

    } catch (error) {
        console.error(`Clock ${req.params.type} error:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const saveAttendancePhoto = async (req, res) => {
    try {
        await poolConnect;
        const { image } = req.body;
        const { type } = req.params;

        // Validate type parameter
        if (type !== 'in' && type !== 'out') {
            return res.status(400).json({ error: 'Type must be either "in" or "out"' });
        }

        const stat = type === 'in' ? 'clockin' : 'clockout';

        if (!image) {
            return res.status(400).json({ error: 'Photo is required' });
        }

        // Get the most recent attendance record for this type using proper SQL Server syntax
        const query = `
            WITH LatestRecord AS (
                SELECT TOP 1 id
                FROM attendance_records
                WHERE stat = @stat
                ORDER BY created_at DESC
            )
            UPDATE attendance_records
            SET image = @image
            WHERE id IN (SELECT id FROM LatestRecord)
        `;

        await pool.request()
            .input('image', image)
            .input('stat', stat)
            .query(query);

        res.json({
            success: true,
            message: 'Attendance photo saved successfully'
        });

    } catch (error) {
        console.error('Save photo error:', error);
        res.status(500).json({
            error: 'Failed to save attendance photo'
        });
    }
};

module.exports = {
    handleClockInOut,
    saveAttendancePhoto
};