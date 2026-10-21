import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart, removeItemFromCart } from '../../actions/cartActions'
import { formatPeso } from '../Utils/helpers'

const Cart = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { cartItems = [] } = useSelector(state => state.cart)
    const totalItems = cartItems.reduce((total, item) => total + Number(item.quantity), 0)
    const subtotal = cartItems.reduce((total, item) => total + item.quantity * item.price, 0)

    const increaseQty = (item) => {
        if (item.quantity < item.stock) {
            dispatch(addItemToCart(item.product, item.quantity + 1, item.size))
        }
    }

    const decreaseQty = (item) => {
        if (item.quantity > 1) {
            dispatch(addItemToCart(item.product, item.quantity - 1, item.size))
        }
    }

    return (
        <>
            <MetaData title="Your Cart" />
            <main className="cart-page">
                <header className="cart-heading">
                    <div>
                        <span className="cart-eyebrow">A little joy is on its way</span>
                        <h1>Your cart</h1>
                        <p>{totalItems} {totalItems === 1 ? 'flower' : 'flowers'} picked just for you</p>
                    </div>
                    <Link to="/" className="cart-continue-link">
                        <i className="fa fa-arrow-left" aria-hidden="true"></i>
                        Continue shopping
                    </Link>
                </header>

                {cartItems.length === 0 ? (
                    <section className="cart-empty-state">
                        <span className="cart-empty-icon"><i className="fa fa-shopping-basket" aria-hidden="true"></i></span>
                        <h2>Your cart is empty</h2>
                        <p>Find a bouquet that says it beautifully.</p>
                        <Link to="/" className="btn btn-primary">Explore the flowers</Link>
                    </section>
                ) : (
                    <div className="cart-layout">
                        <section className="cart-items-panel" aria-label="Items in your cart">
                            <div className="cart-list-heading">
                                <h2>Your flowers <span>{cartItems.length}</span></h2>
                                <span>Price</span>
                            </div>
                            <div className="cart-items-list">
                                {cartItems.map(item => (
                                    <article key={`${item.product}-${item.size || ''}`} className="cart-product">
                                        <Link to={`/product/${item.product}`} className="cart-product-image">
                                            <img src={item.image} alt={item.name} />
                                        </Link>
                                        <div className="cart-product-info">
                                            <Link to={`/product/${item.product}`} className="cart-product-name">{item.name}</Link>
                                            {item.size && <span className="cart-product-size">Size: {item.size}</span>}
                                            <span className="cart-product-unit-price">{formatPeso(item.price)} each</span>
                                            <div className="cart-product-controls">
                                                <div className="cart-quantity-control" aria-label={`Quantity: ${item.quantity}`}>
                                                    <button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={item.quantity <= 1} onClick={() => decreaseQty(item)}>−</button>
                                                    <span aria-live="polite">{item.quantity}</span>
                                                    <button type="button" aria-label={`Increase ${item.name} quantity`} disabled={item.quantity >= item.stock} onClick={() => increaseQty(item)}>+</button>
                                                </div>
                                                {item.quantity >= item.stock && <small className="cart-stock-note">Max available</small>}
                                            </div>
                                        </div>
                                        <div className="cart-product-trailing">
                                            <strong className="cart-product-total">{formatPeso(item.quantity * item.price, 2)}</strong>
                                            <button
                                                type="button"
                                                className="cart-remove-button"
                                                aria-label={`Remove ${item.name} from cart`}
                                                onClick={() => dispatch(removeItemFromCart(item.product, item.size))}
                                            >
                                                <i className="fa fa-trash-o" aria-hidden="true"></i>
                                                <span>Remove</span>
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <aside className="cart-summary-panel">
                            <div className="cart-summary-heading">
                                <span className="cart-summary-icon"><i className="fa fa-leaf" aria-hidden="true"></i></span>
                                <div>
                                    <h2>Order summary</h2>
                                    <p>Your blooms, wrapped with care</p>
                                </div>
                            </div>
                            <div className="cart-summary-lines">
                                <div><span>Items ({totalItems})</span><strong>{formatPeso(subtotal, 2)}</strong></div>
                                <div><span>Delivery</span><span className="cart-summary-muted">Calculated at checkout</span></div>
                            </div>
                            <div className="cart-summary-total">
                                <span>Subtotal</span>
                                <strong>{formatPeso(subtotal, 2)}</strong>
                            </div>
                            <p className="cart-summary-note">Delivery options and final totals are shown at checkout.</p>
                            <button type="button" id="checkout_btn" className="btn btn-primary btn-block" onClick={() => navigate('/login?redirect=shipping')}>
                                Continue to checkout
                                <i className="fa fa-arrow-right" aria-hidden="true"></i>
                            </button>
                            <div className="cart-secure-note">
                                <i className="fa fa-lock" aria-hidden="true"></i>
                                Secure checkout
                            </div>
                        </aside>
                    </div>
                )}
            </main>
        </>
    )
}

export default Cart
