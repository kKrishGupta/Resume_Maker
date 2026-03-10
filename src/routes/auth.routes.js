const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers');

// @routes POST /api/auth/register
// @description Register a new user
router.post('/register', authController.registerUser);
// 
// @routes POST /api/auth/login
// @description Login a user with email and password
// @access Public 
router.post('/login', authController.loginUser);

module.exports = router;
