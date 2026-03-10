const bcrypt = require('bcrypt'); 
const User = require('../models/user.models');
const jwt = require('jsonwebtoken');
const BlackListToken = require('../models/blacklist.models');

// @route registerUser
async function registerUser(req, res) {

  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Please provide all required fields"
    });
  }

  const isUserAlreadyExist = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (isUserAlreadyExist) {
    return res.status(400).json({
      message: "User already exists"
    });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hash
  });


  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", token);

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
}

async function loginUser(req, res) {

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide all required fields"
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid credentials"
    });
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return res.status(400).json({
      message: "Invalid credentials"
    });
  }

  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", token);

  res.status(200).json({
    message: "User logged in successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
}


const logoutUser = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    const blackListToken = new BlackListToken({ token });
    await blackListToken.save();
    res.clearCookie("token");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out user", error });
  }
};

module.exports = {
  registerUser,
  loginUser, logoutUser
};