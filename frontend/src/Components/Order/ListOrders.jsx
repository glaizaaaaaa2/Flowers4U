import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { myOrders, clearErrors } from '../../actions/orderActions'
import { formatDate, formatPeso } from '../Utils/helpers'

const orderStatusClass = (status) => {
    if (status === 'Delivered') return 'order-status is-delivered'
    if (status === 'Cancelled') return 'order-status is-cancelled'
    return 'order-status is-pending'
}

const ListOrders = () => {
    const dispatch = useDispatch()
    const { loading, error, orders = [] } = useSelector(state => state.myOrders)

    useEffect(() => {
        dispatch(myOrders())
    }, [dispatch])

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
    }, [error, dispatch])

    const deliveredCount = orders.filter(order => order.orderStatus === 'Delivered').length

    return (
        <>
            <MetaData title="My Orders" />
            <main className="orders-page">
                <header className="orders-heading">
                    <div>
                        <span className="orders-eyebrow">Your Flowers 4U account</span>
                        <h1>My Orders</h1>
                        <p>Every thoughtful delivery, all in one place.</p>
                    </div>
                    <Link to="/" className="orders-shop-link">
                        <i className="fa fa-leaf" aria-hidden="true"></i>
                        Browse flowers
                    </Link>
                </header>

                {!loading && orders.length > 0 && (
                    <div className="orders-overview" aria-label="Order summary">
                        <div className="orders-stat">
                            <span className="orders-stat-icon"><i className="fa fa-gift" aria-hidden="true"></i></span>
                            <span><strong>{orders.length}</strong><small>{orders.length === 1 ? 'Total order' : 'Total orders'}</small></span>
                        </div>
                        <div className="orders-stat">
                            <span className="orders-stat-icon is-green"><i className="fa fa-check" aria-hidden="true"></i></span>
                            <span><strong>{deliveredCount}</strong><small>{deliveredCount === 1 ? 'Delivered order' : 'Delivered orders'}</small></span>
                        </div>
                    </div>
                )}

                {loading ? <Loader /> : orders.length === 0 ? (
                    <section className="orders-empty">
                        <span className="orders-empty-icon"><i className="fa fa-leaf" aria-hidden="true"></i></span>
                        <h2>Your order history is waiting to bloom</h2>
                        <p>Once you place an order, you’ll find its delivery details and status here.</p>
                        <Link to="/" className="btn btn-primary">Explore the flowers</Link>
                    </section>
                ) : (
                    <section className="orders-list" aria-label="Your orders">
                        {orders.map(order => {
                            const itemCount = order.orderItems.reduce((total, item) => total + item.quantity, 0)
                            const firstItem = order.orderItems[0]

                            return (
                                <article className="order-history-card" key={order._id}>
                                    <div className="order-history-main">
                                        <div className="order-history-identity">
                                            {firstItem?.image ? (
                                                <img className="order-history-image" src={firstItem.image} alt="" />
                                            ) : (
                                                <span className="order-history-image order-history-image-empty">
                                                    <i className="fa fa-leaf" aria-hidden="true"></i>
                                                </span>
                                            )}
                                            <div>
                                                <span className="order-number">Order <span title={order._id}>#{order._id.slice(-8).toUpperCase()}</span></span>
                                                <span className="order-date">Placed for {formatDate(order.deliveryDate)}</span>
                                            </div>
                                        </div>
                                        <div className="order-history-facts">
                                            <div><span>Items</span><strong>{itemCount} {itemCount === 1 ? 'item' : 'items'}</strong></div>
                                            <div><span>Total</span><strong>{formatPeso(order.totalPrice, 2)}</strong></div>
                                            <div>
                                                <span>Status</span>
                                                <strong className={orderStatusClass(order.orderStatus)}>{order.orderStatus || 'Processing'}</strong>
                                            </div>
                                        </div>
                                        <div className="order-history-actions">
                                            <Link to={`/order/${order._id}`} className="order-action-primary">
                                                View order <i className="fa fa-arrow-right" aria-hidden="true"></i>
                                            </Link>
                                            {order.orderStatus === 'Delivered' && (
                                                <Link to={`/receipt/${order._id}`} className="order-action-secondary">
                                                    Receipt
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <div className="order-history-items">
                                        <span className="order-items-label">In this order</span>
                                        <span className="order-items-preview">
                                            {order.orderItems.slice(0, 3).map(item => item.name).join(' · ')}
                                            {order.orderItems.length > 3 && ` +${order.orderItems.length - 3} more`}
                                        </span>
                                    </div>
                                </article>
                            )
                        })}
                    </section>
                )}
            </main>
        </>
    )
}

export default ListOrders
