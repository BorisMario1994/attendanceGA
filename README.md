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

## Support

For issues and support, please create an issue in the GitHub repository.