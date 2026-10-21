import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux'
import { clearErrors, getOrderDetails } from '../../actions/orderActions'
import { formatDate, formatDateTime, formatPeso } from '../Utils/helpers'

const getOrderStatusClass = (status) => {
    if (status === 'Delivered') return 'order-status is-delivered'
    if (status === 'Cancelled') return 'order-status is-cancelled'
    return 'order-status is-pending'
}

const OrderDetails = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const { loading, error, order } = useSelector(state => state.orderDetails);

    useEffect(() => {
        dispatch(getOrderDetails(id))
    }, [dispatch, id])

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' });
            dispatch(clearErrors())
        }
    }, [error, dispatch])

    if (loading || !order || order._id !== id) return <Loader />

    const { shippingInfo = {}, orderItems = [], paymentInfo, user, totalPrice, orderStatus, recipient, deliveryDate, giftMessage, statusHistory = [] } = order
    const isPaid = paymentInfo && paymentInfo.status === 'succeeded'

    const itemCount = orderItems.reduce((total, item) => total + item.quantity, 0)
    const address = [shippingInfo.address, shippingInfo.city, shippingInfo.postalCode, shippingInfo.country]
        .filter(Boolean)
        .join(', ')

    return (
        <>
            <MetaData title="Order Details" />
            <main className="order-detail-page">
                <Link to="/orders/me" className="order-detail-back">
                    <i className="fa fa-arrow-left" aria-hidden="true"></i>
                    Back to my orders
                </Link>

                <header className="order-detail-heading">
                    <div>
                        <span className="order-detail-eyebrow">Order details</span>
                        <h1>Order <span>#{order._id}</span></h1>
                        <p>{itemCount} {itemCount === 1 ? 'item' : 'items'} · Delivery on {formatDate(deliveryDate)}</p>
                    </div>
                    <span className={getOrderStatusClass(orderStatus)}>{orderStatus || 'Processing'}</span>
                </header>

                <div className="order-detail-layout">
                    <div className="order-detail-main">
                        <section className="order-detail-card">
                            <div className="order-card-heading">
                                <span className="order-card-icon"><i className="fa fa-gift" aria-hidden="true"></i></span>
                                <div>
                                    <h2>Delivery details</h2>
                                    <p>We’re sending this order to someone special.</p>
                                </div>
                            </div>
                            <div className="delivery-detail-grid">
                                <div>
                                    <span>Recipient</span>
                                    <strong>{recipient?.name || '—'}</strong>
                                </div>
                                <div>
                                    <span>Recipient phone</span>
                                    <strong>{recipient?.phoneNo || '—'}</strong>
                                </div>
                                <div>
                                    <span>Delivery date</span>
                                    <strong>{formatDate(deliveryDate)}</strong>
                                </div>
                                <div>
                                    <span>Ordered by</span>
                                    <strong>{user?.name || '—'}</strong>
                                    {shippingInfo.phoneNo && <small>{shippingInfo.phoneNo}</small>}
                                </div>
                                <div className="delivery-address">
                                    <span>Delivery address</span>
                                    <strong>{address || '—'}</strong>
                                </div>
                            </div>
                            {giftMessage && (
                                <blockquote className="order-gift-message">
                                    <span>Gift message</span>
                                    <p>“{giftMessage}”</p>
                                </blockquote>
                            )}
                        </section>

                        <section className="order-detail-card">
                            <div className="order-card-heading">
                                <span className="order-card-icon is-green"><i className="fa fa-leaf" aria-hidden="true"></i></span>
                                <div>
                                    <h2>Items in this order</h2>
                                    <p>{itemCount} {itemCount === 1 ? 'lovely item' : 'lovely items'}</p>
                                </div>
                            </div>
                            <div className="order-detail-items">
                                {orderItems.map(item => (
                                    <article className="order-detail-item" key={`${item.product}-${item.size || ''}`}>
                                        <Link to={`/product/${item.product}`} className="order-detail-item-image">
                                            <img src={item.image} alt={item.name} />
                                        </Link>
                                        <div className="order-detail-item-info">
                                            <Link to={`/product/${item.product}`} className="order-detail-item-name">{item.name}</Link>
                                            {item.size && <span className="order-detail-item-size">Size: {item.size}</span>}
                                            <span className="order-detail-item-quantity">Qty {item.quantity}</span>
                                            {orderStatus === 'Delivered' && (
                                                <Link to={`/product/${item.product}?review=write&orderId=${order._id}`} className="order-item-review-link">
                                                    <i className="fa fa-star" aria-hidden="true"></i>
                                                    Submit a review
                                                </Link>
                                            )}
                                        </div>
                                        <strong className="order-detail-item-price">{formatPeso(item.price * item.quantity, 2)}</strong>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="order-detail-sidebar">
                        <section className="order-detail-card order-tracking-card">
                            <div className="order-card-heading">
                                <span className="order-card-icon"><i className="fa fa-truck" aria-hidden="true"></i></span>
                                <div>
                                    <h2>Order progress</h2>
                                    <p>We’ll keep you updated.</p>
                                </div>
                            </div>
                            {statusHistory.length > 0 ? (
                                <ol className="order-status-timeline">
                                    {[...statusHistory].reverse().map((entry, index) => (
                                        <li key={`${entry.status}-${entry.at || index}`} className={index === 0 ? 'is-current' : ''}>
                                            <span className="timeline-marker"><i className="fa fa-check" aria-hidden="true"></i></span>
                                            <div>
                                                <strong>{entry.status}</strong>
                                                <span>{entry.at ? formatDateTime(entry.at) : 'Status updated'}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <div className="order-current-status">
                                    <span className={getOrderStatusClass(orderStatus)}>{orderStatus || 'Processing'}</span>
                                </div>
                            )}
                        </section>

                        <section className="order-detail-card order-summary-card">
                            <div className="order-card-heading">
                                <span className="order-card-icon is-green"><i className="fa fa-credit-card" aria-hidden="true"></i></span>
                                <div>
                                    <h2>Payment summary</h2>
                                    <p className={isPaid ? 'payment-state is-paid' : 'payment-state is-unpaid'}>
                                        <i className={`fa ${isPaid ? 'fa-check-circle' : 'fa-clock-o'}`} aria-hidden="true"></i>
                                        {isPaid ? 'Payment received' : 'Payment pending'}
                                    </p>
                                </div>
                            </div>
                            <dl className="order-price-breakdown">
                                <div><dt>Items</dt><dd>{formatPeso(order.itemsPrice, 2)}</dd></div>
                                <div><dt>Tax</dt><dd>{formatPeso(order.taxPrice, 2)}</dd></div>
                                <div><dt>Delivery</dt><dd>{formatPeso(order.shippingPrice, 2)}</dd></div>
                                <div className="order-total"><dt>Total paid</dt><dd>{formatPeso(totalPrice, 2)}</dd></div>
                            </dl>
                            {orderStatus === 'Delivered' && (
                                <Link to={`/receipt/${order._id}`} className="order-receipt-link">
                                    View receipt <i className="fa fa-arrow-right" aria-hidden="true"></i>
                                </Link>
                            )}
                        </section>
                    </aside>
                </div>
            </main>
        </>
    )
}

export default OrderDetails
