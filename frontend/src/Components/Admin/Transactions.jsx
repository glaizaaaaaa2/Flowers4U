import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { formatDateTime, formatPeso } from '../Utils/helpers'

const transactionStatusClass = (status) => {
    if (status === 'Delivered') return 'admin-transaction-order-status is-delivered'
    if (status === 'Cancelled') return 'admin-transaction-order-status is-cancelled'
    return 'admin-transaction-order-status is-pending'
}

const isPaid = order => order.paymentInfo?.status === 'succeeded'

const Transactions = () => {
    const [orders, setOrders] = useState([])
    const [totalAmount, setTotalAmount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [search, setSearch] = useState('')
    const [paymentFilter, setPaymentFilter] = useState('All payments')

    const loadTransactions = useCallback(async () => {
        setLoadError('')
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/orders`)
            setOrders(data.orders)
            setTotalAmount(data.totalAmount)
        } catch (error) {
            const message = error.response?.data?.message || error.message
            setLoadError(message)
            toast.error(message, { position: 'bottom-right' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const request = window.setTimeout(loadTransactions, 0)
        return () => window.clearTimeout(request)
    }, [loadTransactions])

    const paidOrders = orders.filter(isPaid)
    const unpaidOrders = orders.filter(order => !isPaid(order))
    const paidAmount = paidOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0)

    const filteredOrders = useMemo(() => {
        const query = search.trim().toLowerCase()
        return orders.filter(order => {
            const matchesPayment = paymentFilter === 'All payments'
                || (paymentFilter === 'Paid' ? isPaid(order) : !isPaid(order))
            const matchesSearch = !query || [
                order._id,
                order.paymentInfo?.id,
                order.user?.name,
                order.user?.email
            ].some(value => String(value || '').toLowerCase().includes(query))
            return matchesPayment && matchesSearch
        })
    }, [orders, paymentFilter, search])

    return (
        <>
            <MetaData title="Transactions" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <main className="admin-transactions-page">
                        <header className="admin-transactions-heading">
                            <div>
                                <span className="admin-transactions-eyebrow">Shop management</span>
                                <h1>Transactions</h1>
                                <p>Track payments and order values in one place.</p>
                            </div>
                            <span className="admin-transactions-total">{orders.length} {orders.length === 1 ? 'transaction' : 'transactions'}</span>
                        </header>

                        {!loading && !loadError && (
                            <div className="admin-transactions-stats">
                                <div className="admin-transaction-stat">
                                    <span className="admin-transaction-stat-icon"><i className="fa fa-credit-card" aria-hidden="true"></i></span>
                                    <span><strong>{formatPeso(totalAmount, 2)}</strong><small>Order value, excluding cancelled</small></span>
                                </div>
                                <div className="admin-transaction-stat">
                                    <span className="admin-transaction-stat-icon is-green"><i className="fa fa-check" aria-hidden="true"></i></span>
                                    <span><strong>{formatPeso(paidAmount, 2)}</strong><small>Payments received</small></span>
                                </div>
                                <div className="admin-transaction-stat">
                                    <span className="admin-transaction-stat-icon is-amber"><i className="fa fa-clock-o" aria-hidden="true"></i></span>
                                    <span><strong>{unpaidOrders.length}</strong><small>Pending payments</small></span>
                                </div>
                            </div>
                        )}

                        <section className="admin-transactions-panel">
                            <div className="admin-transactions-toolbar">
                                <div>
                                    <h2>Payment activity</h2>
                                    <p>{loading ? 'Loading transactions…' : `${filteredOrders.length} ${filteredOrders.length === 1 ? 'record' : 'records'} shown`}</p>
                                </div>
                                <div className="admin-transactions-filters">
                                    <label className="admin-transactions-search">
                                        <i className="fa fa-search" aria-hidden="true"></i>
                                        <span className="sr-only">Search transactions</span>
                                        <input
                                            type="search"
                                            placeholder="Search reference or customer"
                                            value={search}
                                            onChange={event => setSearch(event.target.value)}
                                        />
                                    </label>
                                    <label className="admin-transactions-select">
                                        <span className="sr-only">Filter by payment status</span>
                                        <select value={paymentFilter} onChange={event => setPaymentFilter(event.target.value)}>
                                            <option>All payments</option>
                                            <option>Paid</option>
                                            <option>Unpaid</option>
                                        </select>
                                    </label>
                                </div>
                            </div>

                            {loading ? <Loader /> : loadError ? (
                                <div className="admin-transactions-message is-error" role="alert">
                                    <p>{loadError}</p>
                                    <button type="button" onClick={() => { setLoading(true); loadTransactions() }}>Try again</button>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="admin-transactions-message">
                                    <span className="admin-transactions-empty-icon"><i className="fa fa-credit-card" aria-hidden="true"></i></span>
                                    <h3>{orders.length === 0 ? 'No transactions yet' : 'No matching transactions'}</h3>
                                    <p>{orders.length === 0 ? 'Orders and payment records will appear here.' : 'Try a different search or payment filter.'}</p>
                                </div>
                            ) : (
                                <div className="admin-transaction-list">
                                    {filteredOrders.map(order => {
                                        const paid = isPaid(order)
                                        const reference = order.paymentInfo?.id || 'No payment reference'

                                        return (
                                            <article className="admin-transaction-card" key={order._id}>
                                                <div className="admin-transaction-icon">
                                                    <i className={`fa ${paid ? 'fa-credit-card' : 'fa-clock-o'}`} aria-hidden="true"></i>
                                                </div>
                                                <div className="admin-transaction-identity">
                                                    <strong title={reference}>{reference}</strong>
                                                    <span>{order.user?.name || 'Customer unavailable'}</span>
                                                    <small>{order.user?.email || '—'}</small>
                                                </div>
                                                <div className="admin-transaction-fact">
                                                    <span>Transaction date</span>
                                                    <strong>{formatDateTime(order.paidAt || order.createdAt)}</strong>
                                                </div>
                                                <div className="admin-transaction-fact">
                                                    <span>Amount</span>
                                                    <strong>{formatPeso(order.totalPrice, 2)}</strong>
                                                </div>
                                                <span className={`admin-transaction-payment ${paid ? 'is-paid' : 'is-unpaid'}`}>
                                                    <i className={`fa ${paid ? 'fa-check-circle' : 'fa-clock-o'}`} aria-hidden="true"></i>
                                                    {paid ? 'Paid' : 'Unpaid'}
                                                </span>
                                                <span className={transactionStatusClass(order.orderStatus)}>{order.orderStatus || 'Processing'}</span>
                                                <Link to={`/admin/order/${order._id}`} className="admin-transaction-view" aria-label={`View order ${order._id}`} title="View order">
                                                    <i className="fa fa-eye" aria-hidden="true"></i>
                                                    <span>View order</span>
                                                </Link>
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

export default Transactions
