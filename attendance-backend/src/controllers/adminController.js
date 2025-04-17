const { pool, poolConnect } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Default JWT secret if environment variable is not set
const JWT_SECRET = process.env.JWT_SECRET || 'hockattendance2025secretkey123';

const MAX_RETRIES = 10; // Maximum number of retries per record
const RETRY_DELAY = 3000; // 3 seconds between retries

// Add 5 second delay between Python script executions
const SCRIPT_INTERVAL = 3000; // 5 seconds

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
        console.log("tes")
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

const COMPARISON_DELAY = 5000; // 2 seconds delay between comparisons

const processSingleRecord = async (record, pythonCommand) => {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            // Create temporary files for the images
            const regPhotoPath = path.join(os.tmpdir(), `reg_${record.AttendanceId}_${attempt}.jpg`);
            const attendancePhotoPath = path.join(os.tmpdir(), `att_${record.AttendanceId}_${attempt}.jpg`);

            try {
                // Write base64 images to temporary files
                const regPhotoData = record.registration_photo.replace(/^data:image\/\w+;base64,/, '');
                const attPhotoData = record.attendance_photo.replace(/^data:image\/\w+;base64,/, '');
                await fs.writeFile(regPhotoPath, regPhotoData, 'base64');
                await fs.writeFile(attendancePhotoPath, attPhotoData, 'base64');

                const pythonScript = path.join(__dirname, '../utils/face_compare.py');
                console.log(`Attempt ${attempt + 1} for record ${record.AttendanceId}`);

                const result = await new Promise((resolve, reject) => {
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
                        // Clean up temporary files
                        await Promise.all([
                            fs.unlink(regPhotoPath).catch(() => {}),
                            fs.unlink(attendancePhotoPath).catch(() => {})
                        ]);

                        if (errorData) {
                            console.error(`Attempt ${attempt + 1} failed with Python error:`, errorData);
                        }

                        try {
                            if (outputData.trim()) {
                                const comparison = JSON.parse(outputData);
                                resolve(comparison);
                            } else {
                                reject(new Error('No output from Python script'));
                            }
                        } catch (e) {
                            reject(new Error('Failed to parse Python output'));
                        }
                    });

                    pythonProcess.on('error', reject);
                });

                // If we get here and result has no error, return the successful result
                if (!result.error) {
                    console.log(`Success on attempt ${attempt + 1} for record ${record.AttendanceId}`);
                    return {
                        AttendanceId: record.AttendanceId,
                        EmployeeId: record.EmployeeId,
                        AttendanceDate: record.AttendanceDate,
                        AttendanceType: record.AttendanceType,
                        image: record.attendance_photo,
                        registration_photo: record.registration_photo,
                        FaceMatch: result.match,
                        Confidence: result.confidence,
                        Error: null
                    };
                }

                // If result has an error, throw it to trigger retry
                throw new Error(result.error);

            } catch (error) {
                // Clean up temporary files in case of error
                await Promise.all([
                    fs.unlink(regPhotoPath).catch(() => {}),
                    fs.unlink(attendancePhotoPath).catch(() => {})
                ]);
                throw error;
            }
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed for record ${record.AttendanceId}:`, error.message);
            
            if (attempt < MAX_RETRIES - 1) {
                console.log(`Waiting ${RETRY_DELAY/1000} seconds before retry...`);
                await sleep(RETRY_DELAY);
                attempt++;
            } else {
                console.error(`All attempts failed for record ${record.AttendanceId}`);
                return {
                    AttendanceId: record.AttendanceId,
                    EmployeeId: record.EmployeeId,
                    AttendanceDate: record.AttendanceDate,
                    AttendanceType: record.AttendanceType,
                    image: record.attendance_photo,
                    registration_photo: record.registration_photo,
                    FaceMatch: false,
                    Confidence: 0,
                    Error: `Failed after ${MAX_RETRIES} attempts: ${error.message}`
                };
            }
        }
    }
};

const getFaceComparisonResults = async (req, res) => {
    let pythonCommand;
    
    try {
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
        
        const result = await pool.request()
            .input('dateFrom', formattedDateFrom)
            .input('dateTo', formattedDateTo)
            .input('type', type)
            .query(query);

        console.log('SQL result count:', result.recordset.length);
        
        if (result.recordset.length === 0) {
            return res.json([]);
        }

        // Process records sequentially with retries
        const comparisonResults = [];
        for (const record of result.recordset) {
            const processedResult = await processSingleRecord(record, pythonCommand);
            comparisonResults.push(processedResult);
        }

        console.log('Final results count:', comparisonResults.length);
        res.json(comparisonResults);

    } catch (error) {
        console.error('Face comparison error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

module.exports = {
    login,
    getFaceComparisonResults
};