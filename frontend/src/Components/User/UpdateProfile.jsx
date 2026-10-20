import { useState, useEffect } from 'react'
import MetaData from '../Layout/MetaData'
import { useNavigate } from "react-router-dom";
import { updateProfile, loadUser, clearErrors } from '../../actions/userActions'
import { useForm } from 'react-hook-form'

import { UPDATE_PROFILE_RESET } from '../../constants/userConstants'
import { useDispatch, useSelector } from 'react-redux'

// import { getToken } from '../Utils/helpers';


const UpdateProfile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { error, isUpdated, loading } = useSelector(state => state.user)

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { name: '', email: '' }
    })
    const [avatar, setAvatar] = useState('')
    // const [error, setError] = useState('')
    // const [user, setUser] = useState({})
    // const [loading, setLoading] = useState(false)
    // const [isUpdated, setIsUpdated] = useState(false)
    let navigate = useNavigate();

    // const getProfile = async () => {
    //     const config = {
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${getToken()}`
    //         }
    //     }
    //     try {
    //         const { data } = await axios.get(`${import.meta.env.VITE_API}/me`, config)
    //         console.log(data)
    //         setUser(data.user)
    //         setName(data.user.name);
    //         setEmail(data.user.email);
    //         setAvatarPreview(data.user.avatar.url)
    //         setLoading(false)
    //     } catch (error) {
    //         console.log(error)
    //         toast.error('user not found', {
    //             position: 'bottom-right'
    //         });
    //     }
    // }

    // const updateProfile = async (userData) => {
    //     const config = {
    //         headers: {
    //             'Content-Type': 'multipart/form-data',
    //             'Authorization': `Bearer ${getToken()}`
    //         }
    //     }
    //     try {
    //         const { data } = await axios.put(`${import.meta.env.VITE_API}/me/update`, userData, config)
    //         setIsUpdated(data.success)
    //         setLoading(false)
    //         toast.success('user updated', {
    //             position: 'bottom-right'
    //         });
    //         getProfile();
    //         navigate('/me', { replace: true })


    //     } catch (error) {
    //         console.log(error)
    //         toast.error('user not found', {
    //             position: 'bottom-right'
    //         });
    //     }
    // }

    // console.log(error)
    // useEffect(() => {
    //     getProfile()

    // }, [])

    useEffect(() => {
        console.log(user)
        if (user) {
            reset({ name: user.name || '', email: user.email || '' })
        }
        if (error) {
            // alert.error(error);
            console.log(error)
            dispatch(clearErrors());
        }
        if (isUpdated) {
            // alert.success('User updated successfully')
            dispatch(loadUser());
            navigate('/me', { replace: true })
            dispatch({
                type: UPDATE_PROFILE_RESET
            })
        }
    }, [dispatch, error, isUpdated, navigate, reset, user])

    const submitHandler = ({ name, email }) => {
        const formData = new FormData();
        formData.set('name', name.trim());
        formData.set('email', email.trim());
        formData.set('avatar', avatar);
        dispatch(updateProfile(formData))
    }

    const onChange = e => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.readyState === 2) {
                setAvatar(reader.result)
            }
        }

        reader.readAsDataURL(file)

    }
    // console.log(user)


    return (
        <>
            <MetaData title={'Update Profile'} />

            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={handleSubmit(submitHandler)} encType='multipart/form-data'>
                        <h1 className="mt-2 mb-5">Update Profile</h1>

                        <div className="form-group">
                            <label htmlFor="email_field">Name</label>
                            <input
                                type="name"
                                id="name_field"
                                className="form-control"
                                name='name'
                                {...register('name', { required: 'Please enter your name', validate: value => Boolean(value.trim()) || 'Name cannot be blank' })}
                            />
                            {errors.name && <small className="text-danger">{errors.name.message}</small>}
                        </div>

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

                        <div className='form-group'>
                            <label htmlFor='avatar_upload'>Avatar</label>
                            <div className='d-flex align-items-center'>
                                <div>
                                    <figure className='avatar mr-3 item-rtl'>
                                        <img
                                            src={avatar || user?.avatar?.url || '/images/default_avatar.svg'}
                                            className='rounded-circle'
                                            alt='Avatar Preview'
                                        />
                                    </figure>
                                </div>
                                <div className='custom-file'>
                                    <input
                                        type='file'
                                        name='avatar'
                                        className='custom-file-input'
                                        id='customFile'
                                        accept='image/*'
                                        onChange={onChange}
                                    />
                                    <label className='custom-file-label' htmlFor='customFile'>
                                        Choose Avatar
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn update-btn btn-block mt-4 mb-3" disabled={loading ? true : false} >Update</button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default UpdateProfile