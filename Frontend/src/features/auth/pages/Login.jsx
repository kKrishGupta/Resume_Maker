import React, { useState } from 'react'
import '../auth.form.scss'
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';

const Login = () => {

  const { loading, handleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("⚠ Please fill all fields");
      return;
    }

    try {
      setError("");
      await handleLogin({ email, password });
      navigate('/');
    } catch {
      setError("❌ Invalid email or password");
    }
  }

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

          <div className="input-group">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
            />
          </div>

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

          <button className='button primary-button'>
            {loading ? "Logging in..." : "Login"}
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