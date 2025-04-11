# Attendance Management System with Google Authenticator

A web-based attendance system using Google Authenticator for secure clock in/out functionality.

## Prerequisites

- Node.js (v14 or higher)
- SQL Server 2019 or higher
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

Create a .env file in the backend directory with these settings:
```
DB_HOST=localhost
DB_USER=sa
DB_PASSWORD=your_password
DB_NAME=attendance_db
PORT=3001
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:
```bash
cd attendance-frontend
npm install @mui/material @emotion/react @emotion/styled react-icons qrcode.react
```

### 4. Database Setup

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

## Features

- Employee registration with Google Authenticator
- Secure clock in/out using 6-digit PIN
- Real-time PIN verification
- Multiple clock in/out entries allowed
- Clean and responsive UI

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

## Support

For issues and support, please create an issue in the GitHub repository.