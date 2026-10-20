import React, { useState } from 'react'
import { useNavigate } from "react-router-dom";
import { countries } from 'countries-list'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { useDispatch, useSelector } from 'react-redux'
import { saveShippingInfo } from '../../actions/cartActions'

// Delivery window - same rule as the server (tomorrow up to 60 days ahead)
const ymd = (offsetDays) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const Shipping = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { shippingInfo = {}, cartItems } = useSelector(state => state.cart)
    const { user } = useSelector(state => state.auth)

    const countriesList = Object.values(countries)
    const minDate = ymd(1)
    const maxDate = ymd(60)

    const [address, setAddress] = useState(shippingInfo.address || '')
    const [city, setCity] = useState(shippingInfo.city || '')
    const [postalCode, setPostalCode] = useState(shippingInfo.postalCode || '')
    const [phoneNo, setPhoneNo] = useState(shippingInfo.phoneNo || '')
    const [country, setCountry] = useState(shippingInfo.country || 'Philippines')
    const [recipientName, setRecipientName] = useState(shippingInfo.recipientName || (user ? user.name : ''))
    const [recipientPhone, setRecipientPhone] = useState(shippingInfo.recipientPhone || '')
    const [deliveryDate, setDeliveryDate] = useState(
        shippingInfo.deliveryDate && shippingInfo.deliveryDate >= minDate ? shippingInfo.deliveryDate : ''
    )
    const [giftMessage, setGiftMessage] = useState(shippingInfo.giftMessage || '')

    if (cartItems.length === 0) {
        return <h2 className="mt-5">Your cart is empty - add some flowers first.</h2>
    }

    const submitHandler = (e) => {
        e.preventDefault()
        dispatch(saveShippingInfo({
            address, city, phoneNo, postalCode, country,
            recipientName, recipientPhone, deliveryDate, giftMessage
        }))
        navigate('/confirm')
    }

    return (
        <>
            <MetaData title={'Delivery Info'} />
            <CheckoutSteps shipping />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-4">Delivery Info</h1>

                        <div className="form-group">
                            <label htmlFor="delivery_date_field">Delivery Date</label>
                            <input
                                type="date"
                                id="delivery_date_field"
                                className="form-control"
                                value={deliveryDate}
                                min={minDate}
                                max={maxDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                                required
                            />
                            <small className="text-muted">Available from tomorrow up to 60 days ahead.</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="recipient_field">Recipient Name</label>
                            <input type="text" id="recipient_field" className="form-control" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="recipient_phone_field">Recipient Phone</label>
                            <input type="tel" id="recipient_phone_field" className="form-control" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="address_field">Delivery Address</label>
                            <input type="text" id="address_field" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="city_field">City</label>
                            <input type="text" id="city_field" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="postal_code_field">Postal Code</label>
                            <input type="text" id="postal_code_field" className="form-control" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="country_field">Country</label>
                            <select id="country_field" className="form-control" value={country} onChange={(e) => setCountry(e.target.value)} required>
                                {countriesList.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_field">Your Contact No</label>
                            <input type="tel" id="phone_field" className="form-control" value={phoneNo} onChange={(e) => setPhoneNo(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="gift_field">Card Message (optional)</label>
                            <textarea id="gift_field" className="form-control" rows="3" maxLength={300} value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Happy birthday!" />
                        </div>

                        <button id="shipping_btn" type="submit" className="btn btn-block py-3">
                            CONTINUE
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Shipping
