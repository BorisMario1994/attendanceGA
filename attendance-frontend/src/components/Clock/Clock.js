import React, { useState, useEffect } from 'react';
import { TextField, Paper, Box, Typography, Container, Alert } from '@mui/material';
import './Clock.css';

const Clock = ({ type }) => {
  const [pinCode, setPinCode] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  const handlePinChange = (event) => {
    const value = event.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setPinCode(value);
    if (error) setError('');

    // Auto verify when 6 digits are entered
    if (value.length === 6) {
      handleVerification(value);
    }
  };

  const handleVerification = async (code) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clock/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          success: true,
          message: `Clock ${type} successful! Welcome ${data.employeeId}`
        });
        setPinCode(''); // Clear the input
      } else {
        throw new Error(data.error || `Clock ${type} failed`);
      }
    } catch (err) {
      setStatus({
        success: false,
        message: err.message
      });
    }

    // Clear status after 3 seconds
    setTimeout(() => {
      setStatus(null);
    }, 3000);
  };

  // Clear any existing timeouts when component unmounts
  useEffect(() => {
    return () => {
      setStatus(null);
      setError('');
    };
  }, []);

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={6} className="clock-paper">
        <Box className="clock-container">
          <Typography variant="h4" component="h1" gutterBottom>
            Clock {type.charAt(0).toUpperCase() + type.slice(1)}
          </Typography>

          <TextField
            fullWidth
            label="6-Digit PIN"
            variant="outlined"
            value={pinCode}
            onChange={handlePinChange}
            error={!!error}
            helperText={error}
            placeholder="Enter your 6-digit PIN"
            margin="normal"
            inputProps={{
              maxLength: 6,
              inputMode: 'numeric',
              pattern: '[0-9]*'
            }}
            autoFocus
          />

          {status && (
            <Alert 
              severity={status.success ? "success" : "error"}
              sx={{ mt: 2 }}
            >
              {status.message}
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Clock;