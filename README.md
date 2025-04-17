# Attendance Management System with Google Authenticator and Face Recognition

A web-based attendance system using Google Authenticator for secure clock in/out functionality, enhanced with facial recognition for verification.

## Prerequisites

- Node.js (v14 or higher)
- SQL Server 2019 or higher
- Python 3.10 or higher
- Git (optional)

## Installation Steps

### 1. Clone or Download the Project
```bash
git clone https://github.com/BorisMario1994/attendanceGA.git
# or download and extract the zip file
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:
```bash
cd attendance-backend
npm install express mssql cors dotenv speakeasy express-validator --save
npm install nodemon --save-dev
```

Set up your configuration files:
1. Copy `.env.template` to `.env` and update with your database credentials:
```bash
cp .env.template .env
```

2. Copy `db.template.js` to `db.js` in the `src/config` directory:
```bash
cp src/config/db.template.js src/config/db.js
```

3. Update the `.env` file with your database credentials:
```
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=attendance_db
PORT=3001
```

### 3. Python Dependencies Setup

Navigate to the backend directory and install Python requirements:
```bash
cd attendance-backend
pip install -r requirements.txt
```

Note: If you encounter issues with dlib installation, use the provided wheel file:
```bash
cd src/utils
pip install dlib-19.24.99-cp312-cp312-win_amd64.whl  # Use appropriate version for your Python
```

### 4. Frontend Setup

Navigate to the frontend directory and install dependencies:
```bash
cd attendance-frontend
npm install @mui/material @emotion/react @emotion/styled react-icons qrcode.react
```

### 5. Database Setup

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Run the schema.sql file located in attendance-backend/src/config/

## Running the Application

1. Start the backend:
```bash
cd attendance-backend
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
cd attendance-frontend
npm start
```

The application will be available at http://localhost:3000

## Usage Guide

### Admin Panel
1. Access the admin panel at http://localhost:3000/admin
2. Log in with your admin credentials
3. Use the date range picker to select the period you want to review
4. Choose the attendance type (Clock In/Clock Out)
5. Click "Search" to view attendance records
6. The system will automatically verify face matches between registration photos and attendance photos
7. Review the confidence scores and match results for each attendance record

### Employee Registration
1. Navigate to http://localhost:3000/registration
2. Fill in the employee details
3. Take or upload a clear face photo for registration
4. A QR code will be generated - scan it with Google Authenticator
5. Save the registration details

### Clock In/Out Process
1. Go to http://localhost:3000
2. Select Clock In or Clock Out
3. Enter your Employee ID
4. Enter the 6-digit code from Google Authenticator
5. Allow camera access when prompted
6. The system will:
   - Take your photo
   - Verify your face against registration photo
   - Record your attendance with timestamp

## Features

- Employee registration with face photo capture
- Google Authenticator integration for 2FA
- Facial recognition verification for attendance
- Multiple verification attempts for better accuracy
- Secure clock in/out using 6-digit PIN
- Real-time face comparison
- Multiple clock in/out entries allowed
- Clean and responsive UI
- Admin panel for attendance verification
- Face match confidence scoring
- Detailed attendance logs
- Photo verification history

## Troubleshooting

1. Database Connection Issues:
   - Verify SQL Server is running
   - Check credentials in .env file
   - Ensure SQL Server authentication is enabled

2. Node.js Issues:
   - Verify Node.js version (v14+)
   - Clear npm cache if needed: `npm cache clean --force`

3. Frontend Issues:
   - Check if all dependencies are installed
   - Clear browser cache
   - Verify backend URL in API calls

### Face Recognition Issues:
- Ensure good lighting conditions when taking photos
- Face should be clearly visible and centered
- If face detection fails, the system will automatically retry
- Check Python and OpenCV installation if persistent errors occur
- Verify that all Python dependencies are correctly installed

## Configuration Files

The project uses several configuration files that should not be committed to version control:

- `.env`: Contains database credentials and other sensitive settings
- `src/config/db.js`: Database configuration file

Template files are provided for these configurations:
- `.env.template`: Template for environment variables
- `src/config/db.template.js`: Template for database configuration

Always use the template files as a base and create your own local copies with actual credentials.

## Security Notes

- Never commit the `.env` file or `db.js` to version control
- Keep your Google Authenticator QR codes private
- Regularly rotate database credentials in production
- Use strong passwords for database access
- Attendance photos are verified against registration photos
- Face comparison results are logged for security audit

## Support

For issues and support, please create an issue in the GitHub repository.

## System Requirements

### Hardware Requirements:
- Webcam for photo capture
- Sufficient RAM (minimum 8GB recommended)
- Adequate storage for attendance photos

### Software Requirements:
- Modern web browser with camera access
- Google Authenticator app on mobile device
- Python 3.10+ with OpenCV support
- Node.js v14+
- SQL Server 2019+