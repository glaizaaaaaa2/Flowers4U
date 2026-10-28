import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import axios from 'axios';
// import { getUser, authenticate } from '../Utils/helpers';
import { useDispatch, useSelector } from 'react-redux'
import { login, googleLogin, clearErrors } from '../../actions/userActions'

const Login = () => {
    const { isAuthenticated, error, loading, } = useSelector(state => state.auth)
    const { register, handleSubmit, formState: { errors } } = useForm()
    let navigate = useNavigate()
    let location = useLocation()
    const dispatch = useDispatch()

    const submitHandler = ({ email, password }) => {
        dispatch(login(email, password))
    }

    // const login = async (email, password) => {
    //     try {
    //         const config = {
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         }
    //         const { data } = await axios.post(`http://localhost:4001/api/v1/login`, { email, password }, config)
    //         console.log(data)
    //         authenticate(data, () => navigate("/"))

    //     } catch (error) {

    //         toast.error("invalid user or password", {
    //             position: 'bottom-right'
    //         })
    //     }
    // }

    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') : ''
    const redirectTo = redirect === 'shipping'
        ? '/shipping'
        : redirect?.startsWith('/') && !redirect.startsWith('//')
            ? redirect
            : '/'
    // useEffect(() => {
    //     if (getUser()) {
    //         navigate('/')
    //     }
    // }, [])

    // useEffect(() => {
    //     if (getUser() && redirect === 'shipping') {
    //         navigate(`/${redirect}`)
    //     }
    // }, [])

    useEffect(() => {
        if (isAuthenticated) navigate(redirectTo, { replace: true })
        if (error) {
            toast.error(error, { position: 'bottom-right' });
            dispatch(clearErrors());
        }
    }, [error, isAuthenticated, dispatch, navigate, redirectTo])

    return (
        <>
            {loading ? <Loader /> : (
                <>
                    <MetaData title={'Login'} />

                    <div className="row wrapper">
                        <div className="col-10 col-lg-5">
                            <form className="shadow-lg"
                                onSubmit={handleSubmit(submitHandler)}
                            >
                                <h1 className="mb-3">Login</h1>
                                <div className="form-group">
                                    <label htmlFor="email_field">Email</label>
                                    <input
                                        type="email"
                                        id="email_field"
                                        className="form-control"
                                        {...register('email', {
                                            required: 'Please enter your email',
                                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address' }
                                        })}
                                    />
                                    {errors.email && <small className="text-danger">{errors.email.message}</small>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password_field">Password</label>
                                    <input
                                        type="password"
                                        id="password_field"
                                        className="form-control"
                                        {...register('password', { required: 'Please enter your password' })}
                                    />
                                    {errors.password && <small className="text-danger">{errors.password.message}</small>}
                                </div>

                                <Link to="/password/forgot" className="float-right mb-4">Forgot Password?</Link>

                                <button
                                    id="login_button"
                                    type="submit"
                                    className="btn btn-block py-3"
                                >
                                    LOGIN
                                </button>

                                <div className="text-center my-3 text-muted">or</div>
                                <button
                                    id="google_button"
                                    type="button"
                                    className="btn btn-outline-secondary btn-block py-2"
                                    onClick={() => dispatch(googleLogin())}
                                >
                                    <i className="fa fa-google mr-2"></i>Continue with Google
                                </button>

                                <Link to="/register" className="float-right mt-3">New User?</Link>
                            </form>
                        </div>
                    </div>


                </>
            )}
        </>
    )
}
export default Login
