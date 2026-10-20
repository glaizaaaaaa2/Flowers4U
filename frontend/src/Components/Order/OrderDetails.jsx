import React, { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux'
import { clearErrors, getOrderDetails } from '../../actions/orderActions'
import { formatDate, formatDateTime, statusColor, formatPeso } from '../Utils/helpers'

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

    return (
        <>
            <MetaData title={'Order Details'} />
            <div className="row d-flex justify-content-between">
                <div className="col-12 col-lg-8 mt-5 order-details">
                    <h1 className="my-5">Order # {order._id}</h1>

                    <h4 className="mb-4">Delivery Info</h4>
                    <p><b>Delivery date:</b> {formatDate(deliveryDate)}</p>
                    <p><b>Recipient:</b> {recipient && recipient.name} {recipient && recipient.phoneNo ? `(${recipient.phoneNo})` : ''}</p>
                    <p><b>Ordered by:</b> {user && user.name} - {shippingInfo.phoneNo}</p>
                    <p><b>Address:</b> {`${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`}</p>
                    {giftMessage && <p><b>Card message:</b> {giftMessage}</p>}
                    <p><b>Amount:</b> {formatPeso(totalPrice, 2)}</p>

                    <hr />
                    <h4 className="my-4">Payment</h4>
                    <p className={isPaid ? "greenColor" : "redColor"}><b>{isPaid ? "PAID" : "NOT PAID"}</b></p>

                    <h4 className="my-4">Order Status</h4>
                    <p className={statusColor(orderStatus)}><b>{orderStatus}</b></p>
                    {statusHistory.length > 0 && (
                        <ul className="text-muted">
                            {statusHistory.map((h, i) => <li key={i}>{h.status} - {formatDateTime(h.at)}</li>)}
                        </ul>
                    )}
                    {orderStatus === 'Delivered' && (
                        <Link to={`/receipt/${order._id}`} className="btn btn-primary">View Receipt</Link>
                    )}

                    <h4 className="my-4">Order Items:</h4>
                    <hr />
                    <div className="cart-item my-1">
                        {orderItems.map(item => (
                            <div key={`${item.product}-${item.size || ''}`} className="row my-5">
                                <div className="col-4 col-lg-2">
                                    <img src={item.image} alt={item.name} height="45" width="65" />
                                </div>
                                <div className="col-5 col-lg-5">
                                    <Link to={`/product/${item.product}`}>{item.name}</Link>
                                    {item.size && <small className="text-muted"> ({item.size})</small>}
                                </div>
                                <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                    <p>{formatPeso(item.price)}</p>
                                </div>
                                <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                    <p>{item.quantity} Piece(s)</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <hr />
                </div>
            </div>
        </>
    )
}

export default OrderDetails
