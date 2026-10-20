import React, { useState } from 'react'
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { createOrder } from '../../actions/orderActions'
import { clearCart } from '../../actions/cartActions';
import { formatPeso } from '../Utils/helpers'

// NOTE: payment is simulated (same as the original system) - no real card is charged.
const Payment = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cartItems, shippingInfo } = useSelector(state => state.cart)
    const [submitting, setSubmitting] = useState(false)

    const orderInfo = JSON.parse(sessionStorage.getItem('orderInfo') || 'null');

    const submitHandler = async (e) => {
        e.preventDefault();
        setSubmitting(true)

        // the server recalculates prices; we only send what was chosen
        const order = {
            orderItems: cartItems.map(i => ({ product: i.product, quantity: i.quantity, size: i.size, name: i.name })),
            shippingInfo: {
                address: shippingInfo.address,
                city: shippingInfo.city,
                phoneNo: shippingInfo.phoneNo,
                postalCode: shippingInfo.postalCode,
                country: shippingInfo.country
            },
            recipient: { name: shippingInfo.recipientName, phoneNo: shippingInfo.recipientPhone },
            deliveryDate: shippingInfo.deliveryDate,
            giftMessage: shippingInfo.giftMessage,
            paymentInfo: { id: `sim_${Date.now()}`, status: 'succeeded' }
        }

        const result = await dispatch(createOrder(order))
        if (result.success) {
            sessionStorage.removeItem('orderInfo')
            await dispatch(clearCart())
            navigate('/success')
        } else {
            toast.error(result.message, { position: 'bottom-right' })
            setSubmitting(false)
        }
    }

    if (cartItems.length === 0) return <h2 className="mt-5">Your cart is empty.</h2>

    return (
        <>
            <MetaData title={'Payment'} />
            <CheckoutSteps shipping confirmOrder payment />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-4">Card Info</h1>
                        <p className="text-muted">Demo payment - no real card is charged.</p>
                        <div className="form-group">
                            <label htmlFor="card_num_field">Card Number</label>
                            <input type="text" id="card_num_field" className="form-control" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="card_exp_field">Card Expiry</label>
                            <input type="text" id="card_exp_field" className="form-control" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="card_cvc_field">Card CVC</label>
                            <input type="text" id="card_cvc_field" className="form-control" />
                        </div>
                        <button id="pay_btn" type="submit" className="btn btn-block py-3" disabled={submitting}>
                            {submitting ? 'Placing order...' : `Pay${orderInfo ? ` - ${formatPeso(orderInfo.totalPrice, 2)}` : ''}`}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Payment
