import React, { useState } from 'react';
import { TextField, Button, Paper, Box, Typography, Container, Alert, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import format from 'date-fns/format';
import './Admin.css';

const Admin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState('');
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [type, setType] = useState('clockin');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            console.log("Attempting login...");
            const response = await fetch('http://localhost:3001/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }, 
                body: JSON.stringify({ username, password }),
            });
            
            console.log("Response status:", response.status);
            
            // Log the raw response
            const responseText = await response.text();
            console.log("Raw response:", responseText);
            
            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                throw new Error("Invalid response format from server");
            }
            
            console.log("Parsed response:", data);
            
            if (response.ok) {
                setIsLoggedIn(true);
                localStorage.setItem('adminToken', data.token);
                setError('');
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (err) {
            console.error("Full error details:", err);
            setError(err.message);
        }
    };

    const handleProcess = async () => {
        if (!dateFrom || !dateTo) {
            setError('Please select both dates');
            return;
        }

        try {
            setLoading(true);
            setCurrentPage(1); // Reset to first page when new results are loaded
            // Format dates to YYYY-MM-DD format
            const formattedDateFrom = format(dateFrom, 'yyyy-MM-dd');
            const formattedDateTo = format(dateTo, 'yyyy-MM-dd');
            
            const response = await fetch(`http://localhost:3001/api/admin/face-comparison?dateFrom=${formattedDateFrom}&dateTo=${formattedDateTo}&type=${type}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
         
            const data = await response.json();
            console.log(data)
            if (response.ok) {
                setResults(data);
                setError('');
            } else {
                throw new Error(data.error || 'Failed to fetch results');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate pagination
    const totalPages = Math.ceil(results.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentResults = results.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    if (!isLoggedIn) {
        return (
            <Container component="main" maxWidth="sm">
                <Paper elevation={6} className="admin-paper">
                    <Box className="admin-container">
                        <Typography variant="h4" component="h1" gutterBottom>
                            Admin Login
                        </Typography>

                        <form onSubmit={handleLogin}>
                            <TextField
                                fullWidth
                                label="Username"
                                variant="outlined"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                margin="normal"
                                required
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal"
                                required
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ mt: 3 }}
                            >
                                Login
                            </Button>
                        </form>

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                </Paper>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="lg">
            <Paper elevation={6} className="admin-paper">
                <Box className="admin-container">
                    <Typography variant="h4" component="h1" gutterBottom>
                        Face Comparison Results
                    </Typography>

                    <Box className="controls-container">
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="From Date"
                                value={dateFrom}
                                onChange={setDateFrom}
                                renderInput={(params) => <TextField {...params} />}
                                inputFormat="yyyy-MM-dd"
                            />

                            <DatePicker
                                label="To Date"
                                value={dateTo}
                                onChange={setDateTo}
                                renderInput={(params) => <TextField {...params} />}
                                inputFormat="yyyy-MM-dd"
                                minDate={dateFrom}
                            />
                        </LocalizationProvider>

                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={type}
                                label="Type"
                                onChange={(e) => setType(e.target.value)}
                            >
                                <MenuItem value="clockin">Clock In</MenuItem>
                                <MenuItem value="clockout">Clock Out</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            onClick={handleProcess}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Process'}
                        </Button>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {results.length > 0 && (
                        <Box className="results-container" sx={{ mt: 4 }}>
                            <div className="results-grid">
                                <div className="grid-header">
                                    <div>Employee Id</div>
                                    <div>Date</div>
                                    <div>Clock Photo</div>
                                    <div>Registration Photo</div>
                                    <div>Confidence</div>
                                    <div>Match</div>
                                </div>
                                {currentResults.map((result) => (
                                    <div key={result.AttendanceId} className="grid-row">
                                        <div>{result.EmployeeId}</div>
                                        <div>{new Date(result.AttendanceDate).toLocaleDateString()}</div>
                                        <div>
                                            <img 
                                                src={result.image} 
                                                alt="Clock" 
                                                className="result-image"
                                            />
                                        </div>
                                        <div>
                                            <img 
                                                src={result.registration_photo} 
                                                alt="Registration" 
                                                className="result-image"
                                            />
                                        </div>
                                        <div>{(result.Confidence * 100).toFixed(2)}%</div>
                                        <div>{result.FaceMatch ? '✓' : '✗'}</div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination Controls */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
                                <IconButton 
                                    onClick={handlePreviousPage} 
                                    disabled={currentPage === 1}
                                    color="primary"
                                >
                                    <ChevronLeft />
                                </IconButton>
                                <Typography>
                                    Page {currentPage} of {totalPages}
                                </Typography>
                                <IconButton 
                                    onClick={handleNextPage} 
                                    disabled={currentPage === totalPages}
                                    color="primary"
                                >
                                    <ChevronRight />
                                </IconButton>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default Admin;