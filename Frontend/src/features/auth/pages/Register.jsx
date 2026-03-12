import React from 'react'
import { useNavigate } from 'react-router';
import { Link } from "react-router-dom";
const Register = () => {

  const navigate = useNavigate();

  const handleSubmit = (e) =>{
    e.preventDefault();
  };

  return (
 <main>
      <div className='form-container'>
        <h1>Register</h1>
        <form onSubmit = {handleSubmit} action="">
            <div className='input-group'>
              <label htmlFor="username">Username</label>
              <input type="username" id="username" placeholder='Enter your username' required/>
            </div>

            <div className='input-group'>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder='Enter email address' required />
            </div>

            <div className='input-group'>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder='Enter Password'required />
            </div>
            <button type="submit" className='button primary-button'>Register</button>
        </form>

       <p> Already have an account?{" "} <Link to="/login" style={{ color: "blue", textDecoration: "underline" }}>Login
  </Link>
</p>
      </div>
    </main>
  )
}

export default Register
