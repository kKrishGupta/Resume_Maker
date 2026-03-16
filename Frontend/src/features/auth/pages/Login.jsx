import React, { useState } from 'react'
import '../auth.form.scss'
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router';
import { useAuth } from "../auth.context";
const Login = () => {

  const {loading, handleLogin} = useAuth();
  const [email , setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async(e) =>{
    e.preventDefault();
    handleLogin({email, password})
  };
  if(loading){
    return (<main><h1>Loading....</h1></main>)
  }

  return (
    <main>
      <div className='form-container'>
        <h1>Login</h1>
        <form onSubmit = {handleSubmit} action="">
            <div className='input-group'>
              <label htmlFor="email">Email</label>
              <input onChange = {(e) =>{setEmail(e.target.value)}} type="email" id="email" placeholder='Enter email address' />
            </div>
            <div className='input-group'>
              <label htmlFor="password">Password</label>
              <input onChange={(e) =>{setPassword(e.target.value)}} type="password" id="password" placeholder='Enter Password' />
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