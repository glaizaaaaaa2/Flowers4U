import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { getToken } from '../Utils/helpers'

const UsersList = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('All roles')
    const [busyUserId, setBusyUserId] = useState('')

    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
        }
    }), [])

    const loadUsers = useCallback(async () => {
        setLoadError('')
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/users`, config)
            setUsers(data.users)
        } catch (error) {
            const message = error.response?.data?.message || error.message
            setLoadError(message)
            toast.error(message, { position: 'bottom-right' })
        } finally {
            setLoading(false)
        }
    }, [config])

    useEffect(() => {
        const request = window.setTimeout(loadUsers, 0)
        return () => window.clearTimeout(request)
    }, [loadUsers])

    const deleteUser = async (user) => {
        if (!window.confirm(`Delete ${user.name}'s account? This action cannot be undone.`)) return
        setBusyUserId(user._id)
        try {
            await axios.delete(`${import.meta.env.VITE_API}/admin/user/${user._id}`, config)
            setUsers(current => current.filter(item => item._id !== user._id))
            toast.success('User deleted successfully', { position: 'bottom-right' })
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        } finally {
            setBusyUserId('')
        }
    }

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase()
        return users.filter(user => {
            const expectedRole = roleFilter === 'Customer' ? 'user' : roleFilter.toLowerCase()
            const matchesRole = roleFilter === 'All roles' || user.role === expectedRole
            const matchesSearch = !query || [
                user.name,
                user.email,
                user._id
            ].some(value => String(value || '').toLowerCase().includes(query))
            return matchesRole && matchesSearch
        })
    }, [roleFilter, search, users])

    const adminCount = users.filter(user => user.role === 'admin').length
    const customerCount = users.length - adminCount

    return (
        <>
            <MetaData title="All Users" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <main className="admin-users-page">
                        <header className="admin-users-heading">
                            <div>
                                <span className="admin-users-eyebrow">Shop management</span>
                                <h1>Users</h1>
                                <p>Manage customer and administrator accounts.</p>
                            </div>
                            <span className="admin-users-total">{users.length} {users.length === 1 ? 'account' : 'accounts'}</span>
                        </header>

                        {!loading && !loadError && (
                            <div className="admin-users-stats">
                                <div className="admin-user-stat">
                                    <span className="admin-user-stat-icon"><i className="fa fa-users" aria-hidden="true"></i></span>
                                    <span><strong>{users.length}</strong><small>Total accounts</small></span>
                                </div>
                                <div className="admin-user-stat">
                                    <span className="admin-user-stat-icon is-green"><i className="fa fa-user" aria-hidden="true"></i></span>
                                    <span><strong>{customerCount}</strong><small>Customers</small></span>
                                </div>
                                <div className="admin-user-stat">
                                    <span className="admin-user-stat-icon is-amber"><i className="fa fa-shield" aria-hidden="true"></i></span>
                                    <span><strong>{adminCount}</strong><small>Administrators</small></span>
                                </div>
                            </div>
                        )}

                        <section className="admin-users-panel">
                            <div className="admin-users-toolbar">
                                <div>
                                    <h2>Account directory</h2>
                                    <p>{loading ? 'Loading users…' : `${filteredUsers.length} ${filteredUsers.length === 1 ? 'account' : 'accounts'} shown`}</p>
                                </div>
                                <div className="admin-users-filters">
                                    <label className="admin-users-search">
                                        <i className="fa fa-search" aria-hidden="true"></i>
                                        <span className="sr-only">Search users</span>
                                        <input
                                            type="search"
                                            placeholder="Search name, email, or ID"
                                            value={search}
                                            onChange={event => setSearch(event.target.value)}
                                        />
                                    </label>
                                    <label className="admin-users-role-filter">
                                        <span className="sr-only">Filter users by role</span>
                                        <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)}>
                                            <option>All roles</option>
                                            <option>Customer</option>
                                            <option>Admin</option>
                                        </select>
                                    </label>
                                </div>
                            </div>

                            {loading ? <Loader /> : loadError ? (
                                <div className="admin-users-message is-error" role="alert">
                                    <p>{loadError}</p>
                                    <button type="button" onClick={() => { setLoading(true); loadUsers() }}>Try again</button>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="admin-users-message">
                                    <span className="admin-users-empty-icon"><i className="fa fa-users" aria-hidden="true"></i></span>
                                    <h3>{users.length === 0 ? 'No user accounts yet' : 'No matching users'}</h3>
                                    <p>{users.length === 0 ? 'New customer accounts will appear here.' : 'Try a different search or role filter.'}</p>
                                </div>
                            ) : (
                                <div className="admin-user-list">
                                    {filteredUsers.map(user => {
                                        const role = user.role === 'admin' ? 'Administrator' : 'Customer'
                                        const joined = user.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                                            : '—'
                                        const avatar = user.avatar?.url

                                        return (
                                            <article className="admin-user-card" key={user._id}>
                                                {avatar ? (
                                                    <img className="admin-user-avatar" src={avatar} alt="" />
                                                ) : (
                                                    <span className="admin-user-avatar admin-user-avatar-fallback" aria-hidden="true">
                                                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                )}
                                                <div className="admin-user-identity">
                                                    <strong>{user.name || 'Unnamed user'}</strong>
                                                    <span>{user.email}</span>
                                                    <small title={user._id}>ID · {user._id.slice(-8)}</small>
                                                </div>
                                                <span className={`admin-user-role${user.role === 'admin' ? ' is-admin' : ''}`}>
                                                    <i className={`fa ${user.role === 'admin' ? 'fa-shield' : 'fa-user'}`} aria-hidden="true"></i>
                                                    {role}
                                                </span>
                                                <div className="admin-user-joined">
                                                    <span>Joined</span>
                                                    <strong>{joined}</strong>
                                                </div>
                                                <div className="admin-user-actions">
                                                    <Link to={`/admin/user/${user._id}`} className="admin-user-action is-edit" aria-label={`Edit ${user.name}`} title="Edit user">
                                                        <i className="fa fa-pencil" aria-hidden="true"></i>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="admin-user-action is-delete"
                                                        aria-label={`Delete ${user.name}`}
                                                        title="Delete user"
                                                        disabled={busyUserId === user._id}
                                                        onClick={() => deleteUser(user)}
                                                    >
                                                        <i className="fa fa-trash-o" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </article>
                                        )
                                    })}
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>
        </>
    )
}

export default UsersList
