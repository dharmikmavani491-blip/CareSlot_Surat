const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/database');
const User = require('../models/User');
const Patient = require('../models/Patient');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      hospital_id: user.hospital_id
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role = 'patient', hospital_id = null, full_name, age, gender, contact, address } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide username, email, and password.'
      });
    }

    if (!['patient', 'hospital'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either "patient" or "hospital".'
      });
    }

    // Check if email or username exists
    const existingEmail = User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'A user with this email address already exists.'
      });
    }

    const existingUser = User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username is already taken. Please choose another.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = User.create({
      username,
      email,
      passwordHash,
      role,
      hospital_id: role === 'hospital' ? hospital_id : null
    });

    // If patient, create patient profile
    let patientProfile = null;
    if (role === 'patient') {
      patientProfile = Patient.create({
        user_id: newUser.id,
        full_name: full_name || username,
        age: age || null,
        gender: gender || 'Other',
        contact: contact || '',
        address: address || '',
        medical_history: ''
      });
    }

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        hospital_id: newUser.hospital_id,
        patient: patientProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginIdentifier = identifier || email || username;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email/username and password.'
      });
    }

    // Lookup user by email or username
    let user = User.findByEmail(loginIdentifier);
    if (!user) {
      user = User.findByUsername(loginIdentifier);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/username or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email/username or password.'
      });
    }

    // Attach profile data
    let patient = null;
    let hospital = null;
    if (user.role === 'patient') {
      patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id);
    } else if (user.role === 'hospital' && user.hospital_id) {
      hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(user.hospital_id);
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        hospital_id: user.hospital_id,
        patient,
        hospital
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let patient = null;
    let hospital = null;

    if (user.role === 'patient') {
      patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id);
    } else if (user.role === 'hospital' && user.hospital_id) {
      hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(user.hospital_id);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        hospital_id: user.hospital_id,
        patient,
        hospital
      }
    });
  } catch (err) {
    next(err);
  }
};
