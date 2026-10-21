import { Link } from 'react-router-dom'
import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData'
import { useSelector } from 'react-redux'

const Profile = () => {
    const { user, loading } = useSelector(state => state.auth)
    const joinedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—'

    return (
        <>
            {loading ? <Loader /> : (
                <>
                    <MetaData title="Your Profile" />
                    <main className="profile-page">
                        <header className="profile-heading">
                            <span className="profile-eyebrow">Your Flowers 4U account</span>
                            <h1>My Profile</h1>
                            <p>Manage your details and account preferences.</p>
                        </header>

                        <section className="profile-card">
                            <div className="profile-card-content">
                                <div className="profile-identity">
                                    <img
                                        className="profile-avatar"
                                        src={user?.avatar?.url || '/images/default_avatar.svg'}
                                        alt={`${user?.name || 'Your'} profile`}
                                    />
                                    <div className="profile-identity-copy">
                                        <span className="profile-role">{user?.role || 'Customer'}</span>
                                        <h2>{user?.name || 'Welcome'}</h2>
                                        <p>Member since {joinedDate}</p>
                                    </div>
                                </div>
                                <Link to="/me/update" id="edit_profile" className="btn btn-primary profile-edit-button">
                                    <i className="fa fa-pencil" aria-hidden="true"></i>
                                    Edit profile
                                </Link>
                            </div>
                        </section>

                        <div className="profile-content-grid">
                            <section className="profile-details-card">
                                <div className="profile-section-heading">
                                    <span className="profile-section-icon"><i className="fa fa-user-o" aria-hidden="true"></i></span>
                                    <div>
                                        <h2>Personal information</h2>
                                        <p>Your account details</p>
                                    </div>
                                </div>
                                <dl className="profile-detail-list">
                                    <div>
                                        <dt>Full name</dt>
                                        <dd>{user?.name || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt>Email address</dt>
                                        <dd>{user?.email || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt>Account type</dt>
                                        <dd className="profile-account-type">{user?.role || 'Customer'}</dd>
                                    </div>
                                </dl>
                            </section>

                            <section className="profile-actions-card">
                                <div className="profile-section-heading">
                                    <span className="profile-section-icon is-green"><i className="fa fa-cog" aria-hidden="true"></i></span>
                                    <div>
                                        <h2>Account settings</h2>
                                        <p>Shortcuts to manage your account</p>
                                    </div>
                                </div>
                                <div className="profile-action-links">
                                    {user?.role !== 'admin' && (
                                        <Link to="/orders/me" className="profile-action-link">
                                            <span className="profile-action-icon"><i className="fa fa-gift" aria-hidden="true"></i></span>
                                            <span><strong>My orders</strong><small>Track deliveries and view receipts</small></span>
                                            <i className="fa fa-angle-right profile-action-arrow" aria-hidden="true"></i>
                                        </Link>
                                    )}
                                    <Link to="/password/update" className="profile-action-link">
                                        <span className="profile-action-icon is-green"><i className="fa fa-lock" aria-hidden="true"></i></span>
                                        <span><strong>Change password</strong><small>Keep your account secure</small></span>
                                        <i className="fa fa-angle-right profile-action-arrow" aria-hidden="true"></i>
                                    </Link>
                                </div>
                            </section>
                        </div>
                    </main>
                </>
            )}
        </>
    )
}

export default Profile
