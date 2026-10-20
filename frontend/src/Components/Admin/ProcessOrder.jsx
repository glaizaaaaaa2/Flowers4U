import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { ORDER_STATUSES, formatDate, formatDateTime, statusColor, formatPeso } from '../Utils/helpers'

const ProcessOrder = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [status, setStatus] = useState('')
    const [saving, setSaving] = useState(false)

    const load = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`)
            setOrder(data.order)
            setStatus(data.order.orderStatus)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }
    useEffect(() => { load() }, [id])   // eslint-disable-line react-hooks/exhaustive-deps

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

    if (!order) {
        return (
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10"><Loader /></div>
            </div>
        )
    }

    const { shippingInfo = {}, orderItems = [], paymentInfo, user, totalPrice, orderStatus, recipient, deliveryDate, giftMessage, statusHistory = [] } = order
    const isPaid = paymentInfo && paymentInfo.status === 'succeeded'
    const locked = orderStatus === 'Delivered' || orderStatus === 'Cancelled'

    return (
        <>
            <MetaData title={`Process Order # ${order._id}`} />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <div className="row d-flex justify-content-around">
                        <div className="col-12 col-lg-7 order-details">
                            <h2 className="my-5">Order # {order._id}</h2>

                            <h4 className="mb-4">Customer &amp; Delivery</h4>
                            <p><b>Customer:</b> {user && user.name} ({user && user.email})</p>
                            <p><b>Contact:</b> {shippingInfo.phoneNo}</p>
                            <p><b>Delivery date:</b> {formatDate(deliveryDate)}</p>
                            <p><b>Recipient:</b> {recipient && recipient.name} {recipient && recipient.phoneNo ? `(${recipient.phoneNo})` : ''}</p>
                            <p className="mb-2"><b>Address:</b> {`${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`}</p>
                            {giftMessage && <p><b>Card message:</b> {giftMessage}</p>}
                            <p><b>Amount:</b> {formatPeso(totalPrice, 2)}</p>
                            <hr />

                            <h4 className="my-4">Payment</h4>
                            <p className={isPaid ? "greenColor" : "redColor"}><b>{isPaid ? "PAID" : "NOT PAID"}</b></p>
                            <p><b>Reference:</b> {paymentInfo && paymentInfo.id}</p>

                            <h4 className="my-4">Order Status:</h4>
                            <p className={statusColor(orderStatus)}><b>{orderStatus}</b></p>
                            {statusHistory.length > 0 && (
                                <ul className="text-muted">
                                    {statusHistory.map((h, i) => <li key={i}>{h.status} - {formatDateTime(h.at)}</li>)}
                                </ul>
                            )}

                            <h4 className="my-4">Order Items:</h4>
                            <hr />
                            <div className="cart-item my-1">
                                {orderItems.map(item => (
                                    <div key={`${item.product}-${item.size || ''}`} className="row my-5">
                                        <div className="col-4 col-lg-2"><img src={item.image} alt={item.name} height="45" width="65" /></div>
                                        <div className="col-5 col-lg-5">
                                            <Link to={`/product/${item.product}`}>{item.name}</Link>
                                            {item.size && <small className="text-muted"> ({item.size})</small>}
                                        </div>
                                        <div className="col-4 col-lg-2 mt-4 mt-lg-0"><p>{formatPeso(item.price)}</p></div>
                                        <div className="col-4 col-lg-3 mt-4 mt-lg-0"><p>{item.quantity} Piece(s)</p></div>
                                    </div>
                                ))}
                            </div>
                            <hr />
                        </div>

                        <div className="col-12 col-lg-3 mt-5">
                            <h4 className="my-4">Update status</h4>
                            {locked ? (
                                <p className="text-muted">This order is {orderStatus.toLowerCase()} and can no longer be changed.</p>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <button className="btn btn-primary btn-block" disabled={saving || status === orderStatus} onClick={update}>
                                        Update Status
                                    </button>
                                    <small className="text-muted d-block mt-2">The customer receives an email with the order details.</small>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProcessOrder
