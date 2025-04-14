const { pool, poolConnect } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Default JWT secret if environment variable is not set
const JWT_SECRET = process.env.JWT_SECRET || 'hockattendance2025secretkey123';

// Function to find Python executable
const findPythonExecutable = () => {
    // List of possible Python executable names
    const pythonCommands = ['python3', 'python', 'py'];
    
    for (const cmd of pythonCommands) {
        try {
            // Try to execute Python with version flag
            const result = require('child_process').spawnSync(cmd, ['--version']);
            if (result.status === 0) {
                return cmd;
            }
        } catch (e) {
            continue;
        }
    }
    throw new Error('Python executable not found. Please install Python and add it to PATH');
};

const login = async (req, res) => {
    try {
        await poolConnect;
        const { username, password } = req.body;

        const result = await pool.request()
            .input('username', username)
            .query('SELECT id, username, password_hash FROM admins WHERE username = @username');

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = result.recordset[0];
        const validPassword = await bcrypt.compare(password, admin.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            success: true,
            token,
            username: admin.username
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getFaceComparisonResults = async (req, res) => {
    const tempFiles = [];
    let pythonCommand;
    
    try {
        // Try to find Python executable first
        pythonCommand = findPythonExecutable();
        console.log('Using Python command:', pythonCommand);
        
        await poolConnect;
        const { dateFrom, dateTo, type } = req.query;
        console.log('Query params:', { dateFrom, dateTo, type });

        // Format dates for SQL Server
        const formattedDateFrom = new Date(dateFrom).toISOString().split('T')[0];
        const formattedDateTo = new Date(dateTo).toISOString().split('T')[0];

        // Get all attendance records for the date range
        const query = `
            SELECT 
                ar.id as AttendanceId,
                ar.employee_id as EmployeeId,
                ar.created_at as AttendanceDate,
                ar.stat as AttendanceType,
                ar.image as attendance_photo,
                e.photo as registration_photo
            FROM attendance_records ar
            JOIN employees_GA e ON ar.employee_id = e.employee_id
            WHERE CONVERT(date, ar.created_at) >= CONVERT(date, @dateFrom)
            AND CONVERT(date, ar.created_at) <= CONVERT(date, @dateTo)
            AND ar.stat = @type
            AND ar.image IS NOT NULL
            AND e.photo IS NOT NULL
            ORDER BY ar.created_at DESC
        `;
        
        console.log('Executing SQL query with dates:', { formattedDateFrom, formattedDateTo });
        
        const result = await pool.request()
            .input('dateFrom', formattedDateFrom)
            .input('dateTo', formattedDateTo)
            .input('type', type)
            .query(query);

        console.log('SQL result count:', result.recordset.length);
        
        if (result.recordset.length === 0) {
            console.log('No records found matching criteria');
            return res.json([]);
        }

        const comparisonResults = await Promise.all(
            result.recordset.map(async (record, index) => {
                console.log(`Processing record ${index + 1}/${result.recordset.length}`);
                return new Promise(async (resolve) => {
                    try {
                        // Create temporary files for the images
                        const regPhotoPath = path.join(os.tmpdir(), `reg_${record.AttendanceId}.jpg`);
                        const attendancePhotoPath = path.join(os.tmpdir(), `att_${record.AttendanceId}.jpg`);
                        tempFiles.push(regPhotoPath, attendancePhotoPath);

                        // Write base64 images to temporary files
                        const regPhotoData = record.registration_photo.replace(/^data:image\/\w+;base64,/, '');
                        const attPhotoData = record.attendance_photo.replace(/^data:image\/\w+;base64,/, '');
                        
                        await fs.writeFile(regPhotoPath, regPhotoData, 'base64');
                        await fs.writeFile(attendancePhotoPath, attPhotoData, 'base64');

                        const pythonScript = path.join(__dirname, '../utils/face_compare.py');
                        console.log('Python script path:', pythonScript);
                        
                        const pythonProcess = spawn(pythonCommand, [
                            pythonScript,
                            regPhotoPath,
                            attendancePhotoPath
                        ]);

                        let outputData = '';
                        let errorData = '';

                        pythonProcess.stdout.on('data', (data) => {
                            outputData += data.toString();
                        });

                        pythonProcess.stderr.on('data', (data) => {
                            errorData += data.toString();
                            console.error('Python error:', data.toString());
                        });

                        pythonProcess.on('close', async (code) => {
                            console.log(`Python process exited with code ${code}`);
                            
                            // Clean up temporary files
                            await Promise.all([
                                fs.unlink(regPhotoPath).catch(() => {}),
                                fs.unlink(attendancePhotoPath).catch(() => {})
                            ]);

                            if (errorData) {
                                console.error('Python script error:', errorData);
                            }
                            
                            let comparison = { match: false, confidence: 0, error: null };
                            try {
                                if (outputData.trim()) {
                                    comparison = JSON.parse(outputData);
                                    console.log('Face comparison result:', comparison);
                                } else {
                                    console.log('No output from Python script');
                                    comparison.error = 'No output from face comparison';
                                }
                            } catch (e) {
                                console.error('Failed to parse Python output:', e);
                                comparison.error = 'Failed to parse face comparison results';
                            }

                            resolve({
                                AttendanceId: record.AttendanceId,
                                EmployeeId: record.EmployeeId,
                                AttendanceDate: record.AttendanceDate,
                                AttendanceType: record.AttendanceType,
                                image: record.attendance_photo,
                                registration_photo: record.registration_photo,
                                FaceMatch: comparison.match,
                                Confidence: comparison.confidence,
                                Error: comparison.error
                            });
                        });
                    } catch (error) {
                        console.error('Error processing record:', error);
                        resolve({
                            AttendanceId: record.AttendanceId,
                            EmployeeId: record.EmployeeId,
                            AttendanceDate: record.AttendanceDate,
                            AttendanceType: record.AttendanceType,
                            image: record.attendance_photo,
                            registration_photo: record.registration_photo,
                            FaceMatch: false,
                            Confidence: 0,
                            Error: error.message
                        });
                    }
                });
            })
        );

        console.log('Final results count:', comparisonResults.length);
        res.json(comparisonResults);

    } catch (error) {
        console.error('Face comparison error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
        // Clean up any remaining temporary files
        for (const file of tempFiles) {
            fs.unlink(file).catch(() => {});
        }
    }
};

module.exports = {
    login,
    getFaceComparisonResults
};