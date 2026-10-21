import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { toast } from 'react-toastify'
import { formatDate, formatPeso, getToken } from '../Utils/helpers'
import axios from 'axios'

const getOrderStatusClass = (status) => {
    if (status === 'Delivered') return 'admin-order-status is-delivered'
    if (status === 'Cancelled') return 'admin-order-status is-cancelled'
    return 'admin-order-status is-pending'
}

const OrdersList = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [allOrders, setAllOrders] = useState([])
    const [deletingId, setDeletingId] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All statuses')

    const listOrders = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                }
            }
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/orders`, config)
            setAllOrders(data.orders)
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const request = window.setTimeout(listOrders, 0)
        return () => window.clearTimeout(request)
    }, [listOrders])

    const deleteOrderHandler = async (id) => {
        if (!window.confirm('Delete this order? Its stock will be returned if it was not delivered.')) return

        setDeletingId(id)
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                }
            }
            await axios.delete(`${import.meta.env.VITE_API}/admin/order/${id}`, config)
            setAllOrders(orders => orders.filter(order => order._id !== id))
            toast.success('Order deleted successfully', { position: 'bottom-right' })
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || requestError.message, { position: 'bottom-right' })
        } finally {
            setDeletingId('')
        }
    }

    const statuses = useMemo(() => ['All statuses', ...new Set(allOrders.map(order => order.orderStatus).filter(Boolean))], [allOrders])
    const filteredOrders = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()
        return allOrders.filter(order => {
            const matchesStatus = statusFilter === 'All statuses' || order.orderStatus === statusFilter
            const matchesSearch = !normalizedSearch || [
                order._id,
                order.user?.name,
                order.user?.email,
                ...(order.orderItems || []).map(item => item.name)
            ].some(value => String(value || '').toLowerCase().includes(normalizedSearch))
            return matchesStatus && matchesSearch
        })
    }, [allOrders, search, statusFilter])

    const deliveredCount = allOrders.filter(order => order.orderStatus === 'Delivered').length
    const pendingCount = allOrders.filter(order => !['Delivered', 'Cancelled'].includes(order.orderStatus)).length

    return (
        <>
            <MetaData title="All Orders" />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <div className="col-12 col-md-10">
                    <main className="admin-orders-page">
                        <header className="admin-orders-heading">
                            <div>
                                <span className="admin-orders-eyebrow">Shop management</span>
                                <h1>Orders</h1>
                                <p>Review deliveries and keep every order moving.</p>
                            </div>
                            <span className="admin-orders-total">{allOrders.length} total</span>
                        </header>

                        {!loading && !error && (
                            <div className="admin-orders-stats">
                                <div className="admin-orders-stat">
                                    <span className="admin-orders-stat-icon"><i className="fa fa-shopping-bag" aria-hidden="true"></i></span>
                                    <span><strong>{allOrders.length}</strong><small>All orders</small></span>
                                </div>
                                <div className="admin-orders-stat">
                                    <span className="admin-orders-stat-icon is-amber"><i className="fa fa-clock-o" aria-hidden="true"></i></span>
                                    <span><strong>{pendingCount}</strong><small>In progress</small></span>
                                </div>
                                <div className="admin-orders-stat">
                                    <span className="admin-orders-stat-icon is-green"><i className="fa fa-check" aria-hidden="true"></i></span>
                                    <span><strong>{deliveredCount}</strong><small>Delivered</small></span>
                                </div>
                            </div>
                        )}

                        <section className="admin-orders-panel">
                            <div className="admin-orders-toolbar">
                                <div>
                                    <h2>All orders</h2>
                                    <p>{loading ? 'Loading orders…' : `${filteredOrders.length} ${filteredOrders.length === 1 ? 'order' : 'orders'} shown`}</p>
                                </div>
                                <div className="admin-orders-filters">
                                    <label className="admin-orders-search">
                                        <i className="fa fa-search" aria-hidden="true"></i>
                                        <span className="sr-only">Search orders</span>
                                        <input
                                            type="search"
                                            placeholder="Search order, customer, or product"
                                            value={search}
                                            onChange={event => setSearch(event.target.value)}
                                        />
                                    </label>
                                    <label className="admin-orders-status-filter">
                                        <span className="sr-only">Filter orders by status</span>
                                        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                                            {statuses.map(status => <option key={status}>{status}</option>)}
                                        </select>
                                    </label>
                                </div>
                            </div>

                            {loading ? <Loader /> : error ? (
                                <div className="admin-orders-message is-error" role="alert">
                                    <p>{error}</p>
                                    <button type="button" onClick={listOrders}>Try again</button>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="admin-orders-message">
                                    <span className="admin-orders-empty-icon"><i className="fa fa-inbox" aria-hidden="true"></i></span>
                                    <h3>{allOrders.length === 0 ? 'No orders yet' : 'No matching orders'}</h3>
                                    <p>{allOrders.length === 0 ? 'New customer orders will appear here.' : 'Try another search or status filter.'}</p>
                                </div>
                            ) : (
                                <div className="admin-order-list">
                                    {filteredOrders.map(order => {
                                        const itemCount = (order.orderItems || []).reduce((total, item) => total + item.quantity, 0)
                                        const firstItem = order.orderItems?.[0]

                                        return (
                                            <article className="admin-order-card" key={order._id}>
                                                <div className="admin-order-card-main">
                                                    {firstItem?.image ? (
                                                        <img className="admin-order-image" src={firstItem.image} alt="" />
                                                    ) : (
                                                        <span className="admin-order-image admin-order-image-empty"><i className="fa fa-leaf" aria-hidden="true"></i></span>
                                                    )}
                                                    <div className="admin-order-identity">
                                                        <strong title={order._id}>#{order._id.slice(-8).toUpperCase()}</strong>
                                                        <span>{order.user?.name || 'Customer unavailable'}</span>
                                                        <small>{order.user?.email || '—'}</small>
                                                    </div>
                                                    <div className="admin-order-fact admin-order-delivery">
                                                        <span>Delivery</span>
                                                        <strong>{formatDate(order.deliveryDate)}</strong>
                                                    </div>
                                                    <div className="admin-order-fact admin-order-item-count">
                                                        <span>Items</span>
                                                        <strong>{itemCount} {itemCount === 1 ? 'item' : 'items'}</strong>
                                                    </div>
                                                    <div className="admin-order-fact admin-order-amount">
                                                        <span>Total</span>
                                                        <strong>{formatPeso(order.totalPrice, 2)}</strong>
                                                    </div>
                                                    <span className={getOrderStatusClass(order.orderStatus)}>{order.orderStatus || 'Processing'}</span>
                                                    <div className="admin-order-actions">
                                                        <Link to={`/admin/order/${order._id}`} className="admin-order-view">
                                                            <i className="fa fa-eye" aria-hidden="true"></i>
                                                            <span>View</span>
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="admin-order-delete"
                                                            disabled={deletingId === order._id}
                                                            aria-label={`Delete order ${order._id}`}
                                                            onClick={() => deleteOrderHandler(order._id)}
                                                        >
                                                            <i className="fa fa-trash-o" aria-hidden="true"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                {order.orderItems?.length > 0 && (
                                                    <div className="admin-order-items-preview">
                                                        {order.orderItems.slice(0, 3).map(item => item.name).join(' · ')}
                                                        {order.orderItems.length > 3 && ` +${order.orderItems.length - 3} more`}
                                                    </div>
                                                )}
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

export default OrdersList
