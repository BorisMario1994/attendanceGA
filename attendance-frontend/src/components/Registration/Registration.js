import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TextField, Button, Paper, Box, Typography, Container, Alert } from '@mui/material';
import './Registration.css';

const Registration = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);

  const validateEmployeeId = (id) => {
    return /^\d{8}$/.test(id);
  };

  const handleEmployeeIdChange = (event) => {
    const value = event.target.value;
    setEmployeeId(value);
    if (value && !validateEmployeeId(value)) {
      setError('Employee ID must be 8 digits');
    } else {
      setError('');
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      setTimeout(() => {
        setError('');
      }, 3000);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          code: verificationCode
        }),
      });

      const data = await response.json();
      setVerificationStatus(data.success);
      setVerificationCode(''); // Clear the input field
      if (!data.success) {
        setError(data.message || 'Verification failed');
      }

      // Reset verification status after 3 seconds
      setTimeout(() => {
        setVerificationStatus(null);
      }, 3000);

    } catch (err) {
      setError('Verification failed. Please try again.');
      setVerificationStatus(false);
      // Reset error verification status after 3 seconds
      setTimeout(() => {
        setError('');
        setVerificationStatus(null);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      setVerificationStatus(null);
      setError('');
    };
  }, []);


  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateEmployeeId(employeeId)) {
      setError('Please enter a valid 8-digit employee ID');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setQrCodeData(data.otpauthUrl);
        setIsRegistered(true);
        setVerificationStatus(null);
        setVerificationCode('');
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={6} className="registration-paper">
        <Box className="registration-container">
          <Typography variant="h4" component="h1" gutterBottom>
            Employee Registration
          </Typography>
          
          <TextField
            fullWidth
            label="Employee ID"
            variant="outlined"
            value={employeeId}
            onChange={handleEmployeeIdChange}
            error={!!error}
           // helperText={error}
            placeholder="Enter 8-digit Employee ID"
            margin="normal"
            disabled={isRegistered}
          />

          {qrCodeData && (
            <Box className="qr-container">
              <Typography variant="h6" gutterBottom>
                Scan QR Code with Google Authenticator
              </Typography>
              <QRCodeSVG
                value={qrCodeData}
                size={256}
                level="H"
                className="qr-code"
              />
              <Typography variant="body2" color="textSecondary" style={{ marginTop: '1rem' }}>
                Please scan this QR code with Google Authenticator. Keep it safe and do not share with others.
              </Typography>

              <Box className="verification-container" sx={{ mt: 3, width: '100%' }}>
                <TextField
                  fullWidth
                  label="Verification Code"
                  variant="outlined"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  margin="normal"
                  error={!!error && error.includes('code')}
                 
                />
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={handleVerifyCode}
                  disabled={verificationCode.length !== 6}
                  sx={{ mt: 1 }}
                >
                  Verify Code
                </Button>
                {verificationStatus !== null && (
                  <Alert 
                    severity={verificationStatus ? "success" : "error"}
                    sx={{ mt: 2 }}
                  >
                    {verificationStatus ? 'Code verified successfully!' : 'Invalid code. Please try again.'}
                  </Alert>
                )}
              </Box>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={!employeeId || !!error || isRegistered}
            className="submit-button"
          >
            {isRegistered ? 'Registered' : 'Register'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Registration;