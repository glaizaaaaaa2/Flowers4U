import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { ORDER_STATUSES, formatDate, formatDateTime, formatPeso } from '../Utils/helpers'

const ProcessOrder = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let active = true
        axios.get(`${import.meta.env.VITE_API}/order/${id}`)
            .then(({ data }) => {
                if (!active) return
                setOrder(data.order)
                setStatus(data.order.orderStatus)
            })
            .catch(error => {
                if (active) toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => { active = false }
    }, [id])

    const update = async () => {
        if (status === 'Cancelled' && !window.confirm('Cancel this order? The stock will be returned.')) return
        setSaving(true)
        try {
            await axios.put(`${import.meta.env.VITE_API}/admin/order/${id}`, { status })
            toast.success(`Order is now "${status}" - the customer was emailed`, { position: 'bottom-right' })
            navigate('/admin/orders')
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10"><Loader /></div>
            </div>
        )
    }

    if (!order) {
        return (
            <>
                <MetaData title="Order not found" />
                <div className="row">
                    <div className="col-12 col-md-2"><Sidebar /></div>
                    <div className="col-12 col-md-10">
                        <main className="admin-process-page">
                            <section className="admin-process-empty">
                                <h1>Order unavailable</h1>
                                <p>We couldn’t load this order. It may have been removed or you may not have access.</p>
                                <Link to="/admin/orders" className="admin-process-back">Back to all orders</Link>
                            </section>
                        </main>
                    </div>
                </div>
            </>
        )
    }

    const { shippingInfo = {}, orderItems = [], paymentInfo, user, totalPrice, orderStatus, recipient, deliveryDate, giftMessage, statusHistory = [] } = order
    const isPaid = paymentInfo && paymentInfo.status === 'succeeded'
    const locked = orderStatus === 'Delivered' || orderStatus === 'Cancelled'
    const itemCount = orderItems.reduce((total, item) => total + item.quantity, 0)
    const address = [shippingInfo.address, shippingInfo.city, shippingInfo.postalCode, shippingInfo.country]
        .filter(Boolean)
        .join(', ')

    return (
        <>
            <MetaData title={`Process Order # ${order._id}`} />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <main className="admin-process-page">
                        <Link to="/admin/orders" className="admin-process-back">
                            <i className="fa fa-arrow-left" aria-hidden="true"></i>
                            All orders
                        </Link>
                        <header className="admin-process-heading">
                            <div>
                                <span className="admin-process-eyebrow">Order management</span>
                                <h1>Order <span>#{order._id}</span></h1>
                                <p>{itemCount} {itemCount === 1 ? 'item' : 'items'} · Delivery on {formatDate(deliveryDate)}</p>
                            </div>
                            <span className={`admin-order-status ${orderStatus === 'Delivered' ? 'is-delivered' : orderStatus === 'Cancelled' ? 'is-cancelled' : 'is-pending'}`}>
                                {orderStatus || 'Processing'}
                            </span>
                        </header>

                        <div className="admin-process-layout">
                            <div className="admin-process-main">
                                <section className="admin-process-card">
                                    <div className="admin-process-card-heading">
                                        <span className="admin-process-icon"><i className="fa fa-user" aria-hidden="true"></i></span>
                                        <div><h2>Customer &amp; delivery</h2><p>Recipient and delivery details</p></div>
                                    </div>
                                    <div className="admin-process-details">
                                        <div><span>Customer</span><strong>{user?.name || '—'}</strong><small>{user?.email || ''}</small></div>
                                        <div><span>Customer contact</span><strong>{shippingInfo.phoneNo || '—'}</strong></div>
                                        <div><span>Recipient</span><strong>{recipient?.name || '—'}</strong><small>{recipient?.phoneNo || ''}</small></div>
                                        <div><span>Delivery date</span><strong>{formatDate(deliveryDate)}</strong></div>
                                        <div className="admin-process-address"><span>Address</span><strong>{address || '—'}</strong></div>
                                    </div>
                                    {giftMessage && <blockquote className="admin-process-gift"><span>Gift message</span><p>“{giftMessage}”</p></blockquote>}
                                </section>

                                <section className="admin-process-card">
                                    <div className="admin-process-card-heading">
                                        <span className="admin-process-icon is-green"><i className="fa fa-leaf" aria-hidden="true"></i></span>
                                        <div><h2>Order items</h2><p>{itemCount} {itemCount === 1 ? 'item' : 'items'} in this order</p></div>
                                    </div>
                                    <div className="admin-process-items">
                                        {orderItems.map(item => (
                                            <article className="admin-process-item" key={`${item.product}-${item.size || ''}`}>
                                                <Link to={`/product/${item.product}`} className="admin-process-item-image"><img src={item.image} alt={item.name} /></Link>
                                                <div className="admin-process-item-info">
                                                    <Link to={`/product/${item.product}`}>{item.name}</Link>
                                                    {item.size && <span>Size: {item.size}</span>}
                                                    <small>Qty {item.quantity} × {formatPeso(item.price)}</small>
                                                </div>
                                                <strong>{formatPeso(item.quantity * item.price, 2)}</strong>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <aside className="admin-process-sidebar">
                                <section className="admin-process-card">
                                    <div className="admin-process-card-heading">
                                        <span className="admin-process-icon is-green"><i className="fa fa-credit-card" aria-hidden="true"></i></span>
                                        <div><h2>Payment</h2><p className={isPaid ? 'admin-payment-paid' : 'admin-payment-unpaid'}>{isPaid ? 'Paid' : 'Not paid'}</p></div>
                                    </div>
                                    <dl className="admin-payment-details">
                                        <div><dt>Payment status</dt><dd>{isPaid ? 'Received' : 'Pending'}</dd></div>
                                        <div><dt>Reference</dt><dd>{paymentInfo?.id || '—'}</dd></div>
                                        <div className="admin-payment-total"><dt>Order total</dt><dd>{formatPeso(totalPrice, 2)}</dd></div>
                                    </dl>
                                </section>

                                <section className="admin-process-card">
                                    <div className="admin-process-card-heading">
                                        <span className="admin-process-icon"><i className="fa fa-truck" aria-hidden="true"></i></span>
                                        <div><h2>Update status</h2><p>Changes are emailed to the customer.</p></div>
                                    </div>
                                    {locked ? (
                                        <p className="admin-process-locked">This order is {orderStatus.toLowerCase()} and can no longer be changed.</p>
                                    ) : (
                                        <>
                                            <label className="admin-process-status-label" htmlFor="order-status-select">New status</label>
                                            <select id="order-status-select" className="form-control admin-process-status-select" value={status} onChange={event => setStatus(event.target.value)}>
                                                {ORDER_STATUSES.map(value => <option key={value} value={value}>{value}</option>)}
                                            </select>
                                            <button className="btn btn-primary admin-process-update-button" disabled={saving || status === orderStatus} onClick={update}>
                                                {saving ? 'Updating…' : 'Update order status'}
                                            </button>
                                        </>
                                    )}
                                    {statusHistory.length > 0 && (
                                        <ol className="admin-process-timeline">
                                            {[...statusHistory].reverse().map((entry, index) => (
                                                <li key={`${entry.status}-${entry.at || index}`} className={index === 0 ? 'is-current' : ''}>
                                                    <span><i className="fa fa-check" aria-hidden="true"></i></span>
                                                    <div><strong>{entry.status}</strong><small>{entry.at ? formatDateTime(entry.at) : 'Status updated'}</small></div>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </section>
                            </aside>
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}

export default ProcessOrder
