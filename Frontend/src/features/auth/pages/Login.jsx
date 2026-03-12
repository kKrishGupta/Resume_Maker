import React from 'react'
import '../auth.form.scss'
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router';
const Login = () => {

  const navigate = useNavigate();

  const handleSubmit = (e) =>{
    e.preventDefault();
  };

  return (
    <main>
      <div className='form-container'>
        <h1>Login</h1>
        <form onSubmit = {handleSubmit} action="">
            <div className='input-group'>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder='Enter email address' />
            </div>
            <div className='input-group'>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder='Enter Password' />
            </div>
            <button type="submit" className='button primary-button'>Login</button>
        </form>

         <p> Create new account! {" "} <Link to="/Register" style={{ color: "blue", textDecoration: "underline" }}>Register
          </Link>
        </p>

      </div>
    </main>


  )
}
export default Login