import React, {useRef, useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from './authSlice'
import { useLoginMutation } from './authApiSlice'

const Login = () => {
  const userRef = useRef()
  const errRef = useRef()
  const [user, setUser] = useState('')
  const [pwd, setPwd] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const navigate = useNavigate()

  const [login, {isLoading}] = useLoginMutation()
  const dispatch = useDispatch()

  useEffect(()=>{
    userRef.current.focus()
  },[])

  useEffect(()=>{
    setErrMsg('')
  },[user, pwd])

  const handleSubmit = async(e) => {
    e.preventDefault()
    try {
       const userData = await login({userOrEmail: user, password: pwd}).unwrap()
       return;
       dispatch(setCredentials({...userData, user}))
       setUser('')
       setPwd('')
       navigate('/welcome')
    } catch (err) {
       if(!err?.originalStatus) {
          setErrMsg('No Server Response')
       } else if(err?.originalStatus === 400) {
          setErrMsg('Missing Username or Password')
       } else if(err?.originalStatus === 401) {
          setErrMsg('Unauthorized')
       } else {
          setErrMsg('Login Failed')
       }
       errRef.current.focus()
    }
  }

  const handleUserInput = (e) => setUser(e.target.value)
  const handlePwdInput = (e) => setPwd(e.target.value)

  const content = isLoading ? <h1>Loading...</h1> : (
     <section>
        <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"}>{errMsg}</p>
        <h1>Login Page</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
            <label htmlFor='username' className="block font-medium text-gray-700 mb-2">Username:</label>
            <input 
                type="text"
                className="border border-gray-400 p-2 w-full"
                id="username"
                ref={userRef}
                value={user}
                onChange={handleUserInput}
                autoComplete="off"
                required
            />
         </div>
         <div className="mb-4">
            <label htmlFor='password' className="block font-medium text-gray-700 mb-2">Password:</label>
            <input 
                type="text"
                className="border border-gray-400 p-2 w-full"
                id="password"
                value={pwd}
                onChange={handlePwdInput}
                autoComplete="off"
                required
            />
         </div>
            <button 
               type="submit"
               className="bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600"
            >Login</button>
        </form>
     </section>
  )
  return (
   <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded shadow-lg">
      {isLoading && <p>Loading...</p>}
      {!isLoading &&<div className="px-6 py-4">
         <h2 className="text-lg font-medium text-gray-800 mb-4">
            Login To Your Account
         </h2>
         <form onSubmit={handleSubmit}>
            <div className="mb-4">
            <label
               className="block text-gray-700 font-medium mb-2"
               htmlFor="username"
            >
               Username / Email
            </label>
            <input
               className="w-full border border-gray-400 rounded p-2"
               id="username"
               type="text"
               ref={userRef}
               value={user}
               onChange={handleUserInput}
            />
            </div>
            <div className="mb-4">
            <label
               className="block text-gray-700 font-medium mb-2"
               htmlFor="pwd"
            >
               Password
            </label>
            <input
               className="w-full border border-gray-400 rounded p-2"
               id="pwd"
               type="password"
               value={pwd}
               onChange={handlePwdInput}
            />
            </div>
            <button
            className="bg-indigo-500 text-white rounded py-2 px-4 hover:bg-indigo-600"
            type="submit"
            >
            Sign In
            </button>
         </form>
      </div>}
      </div>
   </div>
  )
}

export default Login