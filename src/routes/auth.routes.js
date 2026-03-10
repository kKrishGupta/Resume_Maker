const express = require('express');
const router = express.Router();

// @routes POST /api/auth/register
// @description Register a new user
router.post('/register', (req,res) =>{
  res.send('Register a new user');
});


module.exports = router;
