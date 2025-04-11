import './App.css';
import { useState, useRef } from 'react';
import { MdPersonAdd, MdLogin, MdLogout } from 'react-icons/md';
import { TextField, Alert } from '@mui/material';
import Registration from './components/Registration/Registration';

function App() {
  const [activeButton, setActiveButton] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showClockIn, setShowClockIn] = useState(false);
  const [showClockOut, setShowClockOut] = useState(false);
  const [clockInPin, setClockInPin] = useState('');
  const [clockOutPin, setClockOutPin] = useState('');
  const [status, setStatus] = useState(null);
  const clockInInputRef = useRef(null);
  const clockOutInputRef = useRef(null);

  const handleButtonHover = (button) => {
    setActiveButton(button);
  };

  const handlePinChange = (type, value) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    if (type === 'in') {
      setClockInPin(cleanValue);
    } else {
      setClockOutPin(cleanValue);
    }

    // Auto verify when 6 digits are entered
    if (cleanValue.length === 6) {
      handleVerification(type, cleanValue);
    }
  };

  const handleVerification = async (type, code) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clock/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          success: true,
          message: `Clock ${type} successful! Welcome ${data.employeeId}`
        });
        // Clear the input and hide it
        if (type === 'in') {
          setClockInPin('');
          setShowClockIn(false);
        } else {
          setClockOutPin('');
          setShowClockOut(false);
        }
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

  const handleButtonClick = (component) => {
    if (component === 'registration') {
      setSelectedComponent('registration');
      setShowClockIn(false);
      setShowClockOut(false);
    } else if (component === 'clockin') {
      setShowClockIn(prev => !prev);
      setShowClockOut(false);
      setSelectedComponent(null);
      if (!showClockIn) {
        setTimeout(() => clockInInputRef.current?.focus(), 100);
      }
    } else if (component === 'clockout') {
      setShowClockOut(prev => !prev);
      setShowClockIn(false);
      setSelectedComponent(null);
      if (!showClockOut) {
        setTimeout(() => clockOutInputRef.current?.focus(), 100);
      }
    }
  };

  return (
    <div className="App">
      <div className="attendance-container">
        <h1>HOCK Attendance Management</h1>
        <div className="button-container">
          <div className="button-group">
            <button
              className={`attendance-button registration ${activeButton === 'registration' ? 'active' : ''}`}
              onMouseEnter={() => handleButtonHover('registration')}
              onMouseLeave={() => handleButtonHover(null)}
              onClick={() => handleButtonClick('registration')}
            >
              <MdPersonAdd className="button-icon" />
              <span>Registration</span>
            </button>
          </div>

          <div className="button-group">
            <button
              className={`attendance-button clock-in ${activeButton === 'clockin' ? 'active' : ''}`}
              onMouseEnter={() => handleButtonHover('clockin')}
              onMouseLeave={() => handleButtonHover(null)}
              onClick={() => handleButtonClick('clockin')}
            >
              <MdLogin className="button-icon" />
              <span>Clock In</span>
            </button>
            {showClockIn && (
              <TextField
                inputRef={clockInInputRef}
                className="pin-input"
                label="Enter 6-digit PIN"
                variant="outlined"
                value={clockInPin}
                onChange={(e) => handlePinChange('in', e.target.value)}
                inputProps={{
                  maxLength: 6,
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
              />
            )}
          </div>

          <div className="button-group">
            <button
              className={`attendance-button clock-out ${activeButton === 'clockout' ? 'active' : ''}`}
              onMouseEnter={() => handleButtonHover('clockout')}
              onMouseLeave={() => handleButtonHover(null)}
              onClick={() => handleButtonClick('clockout')}
            >
              <MdLogout className="button-icon" />
              <span>Clock Out</span>
            </button>
            {showClockOut && (
              <TextField
                inputRef={clockOutInputRef}
                className="pin-input"
                label="Enter 6-digit PIN"
                variant="outlined"
                value={clockOutPin}
                onChange={(e) => handlePinChange('out', e.target.value)}
                inputProps={{
                  maxLength: 6,
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
              />
            )}
          </div>
        </div>

        {status && (
          <Alert 
            severity={status.success ? "success" : "error"}
            sx={{ mt: 2, width: '100%', maxWidth: '400px', margin: '20px auto' }}
          >
            {status.message}
          </Alert>
        )}

        {selectedComponent === 'registration' && <Registration />}
      </div>
    </div>
  );
}

export default App;