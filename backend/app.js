const express = require('express');
const cors = require('cors');
const path = require('path');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const slotRoutes = require('./routes/slotRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const patientRoutes = require('./routes/patientRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const labRoutes = require('./routes/labRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');

const app = express();

// Enable CORS for all origins in development
app.use(cors());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));
app.use('/postman', express.static(path.join(__dirname, '../postman')));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Online Hospital Appointment Booking System',
    syllabus: 'WAD PBL Activity 2',
    version: '1.0.0'
  });
});

// Mount modular REST APIs
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Catch API 404s
app.use('/api', notFoundHandler);

// Fallback to frontend index.html for SPA page refresh
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendDir, 'index.html'));
  }
  next();
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
