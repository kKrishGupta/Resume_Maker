import React, { useState } from 'react'
import { useNavigate } from 'react-router';
import { Link } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import '../auth.form.scss';

const Register = () => {
  const navigate = useNavigate();
  const { loading, handleRegister } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) =>{
    e.preventDefault()
    if (!username || !email || !password) {
      setError("⚠ Please fill all fields");
      return;
    }
    try {
      setError("");
      await handleRegister({ username, email, password });
      navigate("/");
    } catch {
      setError("❌ Registration failed");
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
  {/* 🔥 HEADLINE */}
        <div className="auth-header">
            <h1>Welcome to AI-Powered Interview Prep & Resume Builder</h1>
            <p>
            Practice technical questions, build strong resumes, and get job-ready 🚀
            </p>
        </div>


      <div className='form-container'>
        <h1 className="title">Create Account ✨</h1>
        <p className="subtitle">Join us and start your journey 🚀</p>
        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* USERNAME */}
          <div className='input-group'>
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder='Enter your username'
            />
          </div>

          {/* EMAIL */}
          <div className='input-group'>
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder='Enter your email'
            />
          </div>

          {/* PASSWORD */}
          <div className='input-group password-group'>
            <label>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder='Enter your password'
            />

            <button
              type="button"
              className="toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          <button type="submit" className='button primary-button'>
            {loading ? "Creating..." : "Register"}
          </button>

        </form>

        <p className="footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  )
}

export default Register
