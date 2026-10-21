import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import { formatDate, formatDateTime, formatPeso, getToken } from '../Utils/helpers'

// Digital receipt for completed (Delivered) orders. "Print / Save as PDF" uses the browser.
const Receipt = () => {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API}/order/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
            withCredentials: true
        })
            .then(({ data }) => setOrder(data.order))
            .catch(e => setError(e.response?.data?.message || e.message))
    }, [id])

    if (error) return <div className="alert alert-danger mt-5">{error}</div>
    if (!order) return <Loader />

    if (order.orderStatus !== 'Delivered') {
        return (
            <div className="container mt-5" style={{ maxWidth: 640 }}>
                <h3>Receipt not available yet</h3>
                <p>Receipts are issued once an order has been delivered. Current status: <b>{order.orderStatus}</b></p>
                <Link to={`/order/${order._id}`}>Back to order</Link>
            </div>
        )
    }

    const { shippingInfo: ship } = order

    return (
        <>
            <MetaData title={`Receipt ${order._id}`} />
            <div className="receipt-page container">
                <article className="receipt" id="receipt">
                    <header className="receipt-head">
                        <svg className="receipt-mark" viewBox="-32 -32 64 64" aria-hidden="true" focusable="false">
                            <g fill="#e8a5bb">
                                {[0, 72, 144, 216, 288].map(a => (
                                    <ellipse key={a} cx="0" cy="-15" rx="8" ry="12" transform={`rotate(${a})`} />
                                ))}
                            </g>
                            <circle r="6.5" fill="#e9c46a" />
                        </svg>
                        <h2 className="receipt-brand">Flowers 4U</h2>
                        <p className="receipt-kind">Official Receipt</p>
                        <span className="receipt-stamp">Paid</span>
                    </header>

                    <dl className="receipt-meta">
                        <div>
                            <dt>Receipt / Order no.</dt>
                            <dd className="receipt-mono">{order._id}</dd>
                        </div>
                        <div>
                            <dt>Payment ref</dt>
                            <dd className="receipt-mono">{order.paymentInfo && order.paymentInfo.id}</dd>
                        </div>
                        <div>
                            <dt>Customer</dt>
                            <dd>{order.user && order.user.name}</dd>
                        </div>
                        <div>
                            <dt>Recipient</dt>
                            <dd>{order.recipient && order.recipient.name}</dd>
                        </div>
                        <div>
                            <dt>Paid on</dt>
                            <dd>{formatDateTime(order.paidAt)}</dd>
                        </div>
                        <div>
                            <dt>Delivered on</dt>
                            <dd>{formatDateTime(order.deliveredAt)}</dd>
                        </div>
                        <div className="receipt-wide">
                            <dt>Delivery address</dt>
                            <dd>{ship.address}, {ship.city}, {ship.postalCode}, {ship.country}</dd>
                        </div>
                        <div className="receipt-wide">
                            <dt>Scheduled delivery date</dt>
                            <dd>{formatDate(order.deliveryDate)}</dd>
                        </div>
                    </dl>

                    <div className="receipt-tear" aria-hidden="true"></div>

                    <div className="receipt-table-wrap">
                        <table className="receipt-table">
                            <thead>
                                <tr>
                                    <th scope="col">Item</th>
                                    <th scope="col" className="num">Qty</th>
                                    <th scope="col" className="num">Price</th>
                                    <th scope="col" className="num">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.orderItems.map((i, idx) => (
                                    <tr key={idx}>
                                        <td>{i.name}{i.size ? <span className="receipt-size"> ({i.size})</span> : ''}</td>
                                        <td className="num">{i.quantity}</td>
                                        <td className="num">{formatPeso(i.price, 2)}</td>
                                        <td className="num">{formatPeso(i.price * i.quantity, 2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <dl className="receipt-totals">
                        <div><dt>Items</dt><dd>{formatPeso(order.itemsPrice, 2)}</dd></div>
                        <div><dt>Shipping</dt><dd>{formatPeso(order.shippingPrice, 2)}</dd></div>
                        <div><dt>Tax</dt><dd>{formatPeso(order.taxPrice, 2)}</dd></div>
                        <div className="receipt-grand"><dt>Total paid</dt><dd>{formatPeso(order.totalPrice, 2)}</dd></div>
                    </dl>

                    <p className="receipt-thanks">Thank you for shopping with Flowers 4U.</p>
                </article>

                <div className="receipt-actions no-print">
                    <button className="btn btn-primary" onClick={() => window.print()}>Print / Save as PDF</button>
                    <Link to="/orders/me" className="btn btn-outline-secondary">Back to orders</Link>
                </div>
            </div>
        </>
    )
}

export default Receipt
