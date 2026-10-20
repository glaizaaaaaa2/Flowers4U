import React from 'react'
import '../../App.css'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import Swal from 'sweetalert2'
import { logout } from '../../actions/userActions'

import Search from './Search'
import FlowerHeader from './FlowerHeader'

// five-petal brand mark (same flower as the logo file)
const BrandMark = () => (
    <svg className="brand-mark" viewBox="-32 -32 64 64" aria-hidden="true" focusable="false">
        <g fill="#e8a5bb">
            {[0, 72, 144, 216, 288].map(a => (
                <ellipse key={a} cx="0" cy="-15" rx="8" ry="12" transform={`rotate(${a})`} />
            ))}
        </g>
        <circle r="6.5" fill="#e9c46a" />
    </svg>
)

export const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth)
    const { cartItems } = useSelector(state => state.cart)
    const { pathname } = useLocation()

    // the full flower garden + tagline only on the shop front; other pages get a slimmer one
    const isShopFront = pathname === '/' || pathname.startsWith('/search')

    const logoutHandler = async (e) => {
        e.preventDefault()
        const result = await Swal.fire({
            title: 'Are you sure you want to log out?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Log out',
            cancelButtonText: 'Stay logged in',
            confirmButtonColor: '#3d6650',
            cancelButtonColor: '#8a9a90',
            reverseButtons: true,
            focusCancel: true,
        })
        if (!result.isConfirmed) return

        dispatch(logout());
        navigate('/')
        toast.success('You have been logged out', {
            position: 'bottom-right'
        });
    }

    return (
        <header className={`site-header${isShopFront ? ' is-front' : ''}`}>
            <nav className="site-nav">
                <Link to="/" className="brand" aria-label="Flowers 4U home">
                    <BrandMark />
                    <span className="brand-name">Flowers 4U</span>
                </Link>

                <Search />

                <div className="nav-actions">
                    {user ? (
                        <div className="dropdown d-inline">
                            <Link to="#!" className="btn dropdown-toggle account-toggle" type="button" id="dropDownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <figure className="avatar avatar-nav">
                                    <img
                                        src={user.avatar && user.avatar.url}
                                        alt={user && user.name}
                                        className="rounded-circle"
                                    />
                                </figure>
                                <span className="account-name">{user && user.name}</span>
                            </Link>

                            <div className="dropdown-menu dropdown-menu-right" aria-labelledby="dropDownMenuButton">
                                {user && user.role === 'admin' && (
                                    <Link className="dropdown-item" to="/dashboard">Dashboard</Link>
                                )}
                                <Link className="dropdown-item" to="/orders/me">Orders</Link>
                                <Link className="dropdown-item" to="/me">Profile</Link>

                                <Link
                                    className="dropdown-item text-danger" to="/"
                                    onClick={logoutHandler}
                                >
                                    Log out
                                </Link>
                            </div>
                        </div>
                    ) : <Link to="/login" className="btn" id="login_btn">Login</Link>}

                    <Link to="/cart" className="cart-link">
                        <span id="cart">Cart</span>
                        <span id="cart_count">{cartItems ? cartItems.length : null}</span>
                    </Link>
                </div>
            </nav>

            <div className="garden-wrap">
                <FlowerHeader compact={!isShopFront} />
                {isShopFront && (
                    <div className="hero-copy">
                        <p className="hero-title">Fresh flowers for every occasion</p>
                    </div>
                )}
            </div>
        </header>
    )
}
