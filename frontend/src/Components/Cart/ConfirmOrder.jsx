import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { useSelector } from 'react-redux'
import { formatDate, formatPeso } from '../Utils/helpers'

const ConfirmOrder = () => {
    const navigate = useNavigate();
    const { cartItems, shippingInfo } = useSelector(state => state.cart)
    const { user } = useSelector(state => state.auth)

    // Same formula the server uses (the server recalculates and has the final say)
    const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shippingPrice = itemsPrice > 200 ? 0 : 25
    const taxPrice = Number((0.05 * itemsPrice).toFixed(2))
    const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2)

    if (cartItems.length === 0 || !shippingInfo.address || !shippingInfo.deliveryDate) {
        return (
            <>
                <MetaData title="Confirm Order" />
                <main className="confirm-page">
                    <section className="confirm-empty-state">
                        <span className="confirm-empty-icon"><i className="fa fa-clipboard" aria-hidden="true"></i></span>
                        <h1>Nothing to confirm yet</h1>
                        <p>Add flowers to your cart and enter delivery details to review your order here.</p>
                        <Link to="/cart" className="btn btn-primary">Back to cart</Link>
                    </section>
                </main>
            </>
        )
    }

    const processToPayment = () => {
        sessionStorage.setItem('orderInfo', JSON.stringify({
            itemsPrice: itemsPrice.toFixed(2),
            shippingPrice,
            taxPrice,
            totalPrice
        }))
        navigate('/payment')
    }

    return (
        <>
            <MetaData title="Confirm Order" />
            <CheckoutSteps shipping confirmOrder />
            <main className="confirm-page">
                <header className="confirm-heading">
                    <div>
                        <span className="confirm-eyebrow">One last look</span>
                        <h1>Review your order</h1>
                        <p>Make sure everything is just right before payment.</p>
                    </div>
                    <span className="confirm-item-count">{cartItems.length} {cartItems.length === 1 ? 'product' : 'products'}</span>
                </header>

                <div className="confirm-layout">
                    <div className="confirm-main">
                        <section className="confirm-card">
                            <div className="confirm-card-heading">
                                <span className="confirm-card-icon"><i className="fa fa-gift" aria-hidden="true"></i></span>
                                <div>
                                    <h2>Delivery details</h2>
                                    <p>Your flowers are headed somewhere special.</p>
                                </div>
                                <Link to="/shipping" className="confirm-edit-link">Edit</Link>
                            </div>
                            <div className="confirm-delivery-grid">
                                {user && <div><span>Ordered by</span><strong>{user.name}</strong></div>}
                                <div><span>Delivery date</span><strong>{formatDate(shippingInfo.deliveryDate)}</strong></div>
                                <div><span>Recipient</span><strong>{shippingInfo.recipientName || '—'}</strong></div>
                                {shippingInfo.recipientPhone && <div><span>Recipient phone</span><strong>{shippingInfo.recipientPhone}</strong></div>}
                                <div><span>Your contact</span><strong>{shippingInfo.phoneNo}</strong></div>
                                <div className="confirm-delivery-address">
                                    <span>Delivery address</span>
                                    <strong>{[shippingInfo.address, shippingInfo.city, shippingInfo.postalCode, shippingInfo.country].filter(Boolean).join(', ')}</strong>
                                </div>
                            </div>
                            {shippingInfo.giftMessage && (
                                <blockquote className="confirm-gift-message">
                                    <span>Gift message</span>
                                    <p>“{shippingInfo.giftMessage}”</p>
                                </blockquote>
                            )}
                        </section>

                        <section className="confirm-card">
                            <div className="confirm-card-heading">
                                <span className="confirm-card-icon is-green"><i className="fa fa-leaf" aria-hidden="true"></i></span>
                                <div>
                                    <h2>Your flowers</h2>
                                    <p>{cartItems.reduce((total, item) => total + Number(item.quantity), 0)} items, carefully chosen</p>
                                </div>
                                <Link to="/cart" className="confirm-edit-link">Edit cart</Link>
                            </div>
                            <div className="confirm-items-list">
                                {cartItems.map(item => (
                                    <article className="confirm-item" key={`${item.product}-${item.size || ''}`}>
                                        <Link to={`/product/${item.product}`} className="confirm-item-image">
                                            <img src={item.image} alt={item.name} />
                                        </Link>
                                        <div className="confirm-item-info">
                                            <Link to={`/product/${item.product}`} className="confirm-item-name">{item.name}</Link>
                                            {item.size && <span className="confirm-item-size">Size: {item.size}</span>}
                                            <span className="confirm-item-quantity">Qty {item.quantity} × {formatPeso(item.price)}</span>
                                        </div>
                                        <strong className="confirm-item-total">{formatPeso(item.quantity * item.price, 2)}</strong>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="confirm-summary">
                        <div className="confirm-summary-heading">
                            <span className="confirm-card-icon is-green"><i className="fa fa-credit-card" aria-hidden="true"></i></span>
                            <div>
                                <h2>Order summary</h2>
                                <p>All the details, at a glance.</p>
                            </div>
                        </div>
                        <dl className="confirm-price-lines">
                            <div><dt>Subtotal</dt><dd>{formatPeso(itemsPrice, 2)}</dd></div>
                            <div><dt>Shipping</dt><dd>{shippingPrice === 0 ? 'Free' : formatPeso(shippingPrice, 2)}</dd></div>
                            <div><dt>Tax</dt><dd>{formatPeso(taxPrice, 2)}</dd></div>
                            <div className="confirm-total"><dt>Total</dt><dd>{formatPeso(totalPrice, 2)}</dd></div>
                        </dl>
                        <p className="confirm-summary-note">Shipping is free on orders over ₱200.</p>
                        <button type="button" id="checkout_btn" className="btn btn-primary btn-block" onClick={processToPayment}>
                            Proceed to payment
                            <i className="fa fa-arrow-right" aria-hidden="true"></i>
                        </button>
                        <div className="confirm-secure-note"><i className="fa fa-lock" aria-hidden="true"></i> Secure checkout</div>
                        <Link to="/cart" className="confirm-back-link">Back to cart</Link>
                    </aside>
                </div>
            </main>
        </>
    )
}

export default ConfirmOrder
