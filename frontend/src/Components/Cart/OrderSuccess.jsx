import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'

const OrderSuccess = () => {
    return (
        <>
            <MetaData title="Order Success" />
            <main className="order-success-page">
                <section className="order-success-card">
                    <div className="order-success-art">
                        <span className="order-success-sparkle sparkle-one" aria-hidden="true">✦</span>
                        <span className="order-success-sparkle sparkle-two" aria-hidden="true">✦</span>
                        <img src="/images/order_success.png" alt="" width="200" height="200" />
                    </div>
                    <span className="order-success-kicker">
                        <i className="fa fa-check-circle" aria-hidden="true"></i>
                        Order confirmed
                    </span>
                    <h1>Your thoughtful gift is on its way</h1>
                    <p className="order-success-message">
                        Your order has been placed successfully. We’ve emailed you the details and will send an update as its status changes.
                    </p>
                    <div className="order-success-next">
                        <span className="order-success-next-icon"><i className="fa fa-envelope-o" aria-hidden="true"></i></span>
                        <p><strong>What happens next?</strong><br />Keep an eye on your inbox for your order confirmation and delivery updates.</p>
                    </div>
                    <div className="order-success-actions">
                        <Link to="/orders/me" className="order-success-primary">
                            View my orders
                            <i className="fa fa-arrow-right" aria-hidden="true"></i>
                        </Link>
                        <Link to="/" className="order-success-secondary">Back to flowers</Link>
                    </div>
                    <p className="order-success-thanks">Thank you for choosing Flowers 4U <span aria-hidden="true">♡</span></p>
                </section>
            </main>
        </>
    )
}

export default OrderSuccess