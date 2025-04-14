import './App.css';
import { useState, useRef } from 'react';
import { MdPersonAdd, MdLogin, MdLogout, MdAssignment } from 'react-icons/md';
import { TextField, Alert } from '@mui/material';
import Registration from './components/Registration/Registration';
import PhotoCountdown from './components/PhotoCountdown/PhotoCountdown';
import Admin from './components/Admin/Admin';

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
  const [showPhotoCountdown, setShowPhotoCountdown] = useState(false);
  const [currentClockType, setCurrentClockType] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

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

  const handlePhotoTaken = async (imageSrc) => {
    try {
      // Update the attendance record with the photo
      const response = await fetch(`http://localhost:3001/api/clock/${currentClockType}/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageSrc
        }),
      });

      if (response.ok) {
        setShowPhotoCountdown(false); // Hide the countdown first
        setStatus({
          success: true,
          message: `Clock ${currentClockType} completed with photo`
        });
        // Clear final status after showing completion message
        setTimeout(() => {
          setStatus(null);
        }, 3000);
      } else {
        throw new Error('Failed to save attendance photo');
      }
    } catch (err) {
      setShowPhotoCountdown(false);
      setStatus({
        success: false,
        message: 'Failed to save attendance photo'
      });
      setTimeout(() => {
        setStatus(null);
      }, 3000);
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
      console.log(data)
      if (response.ok) {
        setStatus({
          success: true,
          message: `Clock ${type} ${data.employeeId} successful! Please face the camera for attendance photo`
        });
        // Clear the input and hide it
        if (type === 'in') {
          setClockInPin('');
          setShowClockIn(false);
        } else {
          setClockOutPin('');
          setShowClockOut(false);
        }
        setCurrentClockType(type);
        // Show photo countdown after successful verification
        setTimeout(() => {
          setShowPhotoCountdown(true);
        }, 1000);
      } else {
        throw new Error(data.error || `Clock ${type} failed`);
      }
    } catch (err) {
      setStatus({
        success: false,
        message: err.message
      });
      // Clear error status after 3 seconds
      setTimeout(() => {
        setStatus(null);
      }, 3000);
    }
  };

  const handleButtonClick = (component) => {
    if (component === 'registration') {
      setSelectedComponent('registration');
      setShowClockIn(false);
      setShowClockOut(false);
      setShowAdmin(false);
    } else if (component === 'clockin') {
      setShowClockIn(prev => !prev);
      setShowClockOut(false);
      setSelectedComponent(null);
      setShowAdmin(false);
      if (!showClockIn) {
        setTimeout(() => clockInInputRef.current?.focus(), 100);
      }
    } else if (component === 'clockout') {
      setShowClockOut(prev => !prev);
      setShowClockIn(false);
      setSelectedComponent(null);
      setShowAdmin(false);
      if (!showClockOut) {
        setTimeout(() => clockOutInputRef.current?.focus(), 100);
      }
    } else if (component === 'check') {
      setShowAdmin(true);
      setShowClockIn(false);
      setShowClockOut(false);
      setSelectedComponent(null);
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

          <div className="button-group">
            <button
              className={`attendance-button check ${activeButton === 'check' ? 'active' : ''}`}
              onMouseEnter={() => handleButtonHover('check')}
              onMouseLeave={() => handleButtonHover(null)}
              onClick={() => handleButtonClick('check')}
            >
              <MdAssignment className="button-icon" />
              <span>Check</span>
            </button>
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
        {showPhotoCountdown && (
          <PhotoCountdown
            onPhotoTaken={handlePhotoTaken}
            onClose={() => setShowPhotoCountdown(false)}
          />
        )}
        {showAdmin && <Admin />}
      </div>
    </div>
  );
}

export default App;