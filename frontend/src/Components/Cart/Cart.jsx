import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart, removeItemFromCart } from '../../actions/cartActions'
import { formatPeso } from '../Utils/helpers'

const Cart = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate()
    const { cartItems } = useSelector(state => state.cart)

    const increaseQty = (item) => {
        if (item.quantity + 1 > item.stock) return;
        dispatch(addItemToCart(item.product, item.quantity + 1, item.size))
    }

    const decreaseQty = (item) => {
        if (item.quantity - 1 <= 0) return;
        dispatch(addItemToCart(item.product, item.quantity - 1, item.size))
    }

    const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0)

    return (
        <>
            <MetaData title={'Your Cart'} />
            {cartItems.length === 0 ? <h2 className="mt-5">Your Cart is Empty</h2> : (
                <>
                    <h2 className="mt-5">Your Cart: <b>{cartItems.length} items</b></h2>

                    <div className="row d-flex justify-content-between">
                        <div className="col-12 col-lg-8">
                            {cartItems.map(item => (
                                <div key={`${item.product}-${item.size || ''}`}>
                                    <hr />
                                    <div className="cart-item">
                                        <div className="row">
                                            <div className="col-4 col-lg-3">
                                                <img src={item.image} alt={item.name} height="90" width="115" />
                                            </div>

                                            <div className="col-5 col-lg-3">
                                                <Link to={`/product/${item.product}`}>{item.name}</Link>
                                                {item.size && <div><small className="text-muted">Size: {item.size}</small></div>}
                                            </div>

                                            <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                                <p id="card_item_price">{formatPeso(item.price)}</p>
                                            </div>

                                            <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                                <div className="stockCounter d-inline">
                                                    <span className="btn btn-danger minus" onClick={() => decreaseQty(item)}>-</span>
                                                    <input type="number" className="form-control count d-inline" value={item.quantity} readOnly />
                                                    <span className="btn btn-primary plus" onClick={() => increaseQty(item)}>+</span>
                                                </div>
                                                {item.quantity >= item.stock && <small className="d-block text-warning">Max available</small>}
                                            </div>

                                            <div className="col-4 col-lg-1 mt-4 mt-lg-0">
                                                <i id="delete_cart_item" className="fa fa-trash btn btn-danger" onClick={() => dispatch(removeItemFromCart(item.product, item.size))}></i>
                                            </div>
                                        </div>
                                    </div>
                                    <hr />
                                </div>
                            ))}
                        </div>

                        <div className="col-12 col-lg-3 my-4">
                            <div id="order_summary">
                                <h4>Order Summary</h4>
                                <hr />
                                <p>Subtotal:  <span className="order-summary-values">{cartItems.reduce((acc, item) => acc + Number(item.quantity), 0)} (Units)</span></p>
                                <p>Est. total: <span className="order-summary-values">{formatPeso(subtotal, 2)}</span></p>
                                <hr />
                                <button id="checkout_btn" className="btn btn-primary btn-block" onClick={() => navigate('/login?redirect=shipping')}>Check out</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default Cart
