import React, { useState } from 'react'
import '../auth.form.scss'
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';

const Login = () => {

  const { loading, handleLogin, handleSendOtp, handleOtpLogin } = useAuth();;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("password"); // password | otp
   const [otp, setOtp] = useState("");
   const [otpSent, setOtpSent] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setError("");

    if (mode === "password") {
      await handleLogin({ email, password });
      navigate("/");
    } 
    
  else if (mode === "otp") {

  if (!email) {
    setError("⚠ Please enter email");
    return;
  }

  // STEP 1: SEND OTP
  if (!otpSent) {
    await handleSendOtp({ email });
    setOtpSent(true);
    return;
  }

  // 🔥 STEP 2: VALIDATE OTP INPUT
  if (!otp) {
    setError("⚠ Please enter OTP");
    return;
  }

  // STEP 3: VERIFY OTP
  await handleOtpLogin({ email, otp });
  navigate("/");
}

  } catch {
    setError("❌ Something went wrong");
  }
};

  if (loading) {
    return (
      <main>
        <div className="loader"></div>
      </main>
    )
  }

   return (
    <main>
      <div className="form-container">

        <h1 className="title">Welcome Back 👋</h1>
        <p className="subtitle">Login to continue your journey 🚀</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}
          <div className="input-group">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
            />
          </div>

          {/* 🔐 PASSWORD FIELD (ONLY FOR PASSWORD MODE) */}
          {mode === "password" && (
            <div className="input-group password-group">
              <label>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
              />

              <span
                className="toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁"}
              </span>
            </div>
          )}

          {/* 📩 OTP FIELD */}
          {mode === "otp" && otpSent && (
            <div className="input-group">
              <label>Enter OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
              />
            </div>
          )}

          {/* ✅ SUCCESS MESSAGE */}
          {otpSent && mode === "otp" && (
            <p style={{ color: "green" }}>OTP sent to your email 📩</p>
          )}

          {/* 🔥 MODE SWITCH */}
        <div className="mode-toggle">
          <button
            className={mode === "password" ? "active" : ""}
            onClick={() => setMode("password")}
            >
            Password
            </button>

            <button
            className={mode === "otp" ? "active" : ""}
            onClick={() => setMode("otp")}
            >
            OTP
            </button>
        </div>

          {/* 🔥 BUTTON */}
          <button className='button primary-button'>
            {loading
              ? "Processing..."
              : mode === "password"
              ? "Login"
              : otpSent
              ? "Verify OTP"
              : "Send OTP"}
          </button>

        </form>

        <p className="footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

      </div>
    </main>
  )
}

export default Login;