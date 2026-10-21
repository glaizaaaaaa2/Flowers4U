import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Carousel } from 'react-bootstrap'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import ListReviews from '../Review/ListReviews'
import { stockInfo, formatPeso } from '../Utils/helpers'
import { getProductDetails } from '../../actions/productActions'
import { addItemToCart } from '../../actions/cartActions'

const ProductDetails = () => {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const reviewRequested = searchParams.get('review') === 'write'
    const dispatch = useDispatch()
    const { loading, product } = useSelector(state => state.productDetails)
    const { user } = useSelector(state => state.auth)

    const [quantity, setQuantity] = useState(1)
    const [size, setSize] = useState('')

    // review state
    const [canReview, setCanReview] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [rating, setRating] = useState(0)
    const [hover, setHover] = useState(0)
    const [comment, setComment] = useState('')
    const [sending, setSending] = useState(false)

    const hasSizes = product && product.sizes && product.sizes.length > 0
    const selectedSize = hasSizes ? product.sizes.find(s => s.name === size) : null
    const price = selectedSize ? selectedSize.price : product && product.price
    const info = stockInfo(product || {})

    useEffect(() => {
        dispatch(getProductDetails(id))
        setQuantity(1)
        setSize('')
    }, [id, dispatch])

    // only customers who received this product can review it
    const loadReviewAccess = async () => {
        if (!user) { setCanReview(false); return }
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}/can-review`)
            setCanReview(data.canReview)
            setShowForm(data.canReview && reviewRequested)
            if (data.review) { setRating(data.review.rating); setComment(data.review.comment) }
        } catch (e) {
            setCanReview(false)
            setShowForm(false)
        }
    }
    useEffect(() => { loadReviewAccess() }, [id, user, reviewRequested])

    const addToCart = async () => {
        if (hasSizes && !size) {
            toast.error('Please choose a size first', { position: 'bottom-right' })
            return
        }
        const ok = await dispatch(addItemToCart(id, quantity, size))
        if (ok) toast.success('Added to cart', { position: 'bottom-right' })
    }

    const submitReview = async () => {
        if (!rating) { toast.error('Please choose a star rating', { position: 'bottom-right' }); return }
        if (!comment.trim()) { toast.error('Please write a comment', { position: 'bottom-right' }); return }
        setSending(true)
        try {
            const { data } = await axios.put(`${import.meta.env.VITE_API}/review`, { rating, comment, productId: id })
            toast.success('Thanks for your review!', { position: 'bottom-right' })
            if (data.filtered) toast.info('Some words in your review were hidden by our language filter', { position: 'bottom-right' })
            setShowForm(false)
            dispatch(getProductDetails(id))
            loadReviewAccess()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        } finally {
            setSending(false)
        }
    }

    if (loading || !product || !product._id) return <Loader />

    return (
        <>
            <MetaData title={product.name} />
            <main className="product-detail-page">
                <Link to="/" className="product-back-link">
                    <i className="fa fa-arrow-left" aria-hidden="true"></i>
                    <span>Back to flowers</span>
                </Link>

                <section className="product-overview">
                    <div className="product-visual" id="product_image">
                        <div className="product-gallery">
                            {product.images && product.images.length > 0 ? (
                                <Carousel pause="hover" interval={null} indicators={product.images.length > 1} controls={product.images.length > 1}>
                                    {product.images.map(image => (
                                        <Carousel.Item key={image.public_id}>
                                            <img className="product-gallery-img" src={image.url} alt={product.name} />
                                        </Carousel.Item>
                                    ))}
                                </Carousel>
                            ) : (
                                <div className="product-gallery-empty">No photo yet</div>
                            )}
                        </div>
                    </div>

                    <div className="product-summary">
                        <span className="product-category">{product.category}</span>
                        <h1 className="product-name">{product.name}</h1>
                        <p id="product_id">Product # {product._id}</p>

                        <div className="product-rating">
                            <div className="rating-outer">
                                <div className="rating-inner" style={{ width: `${(product.ratings / 5) * 100}%` }}></div>
                            </div>
                            <span className="product-rating-value">{product.numOfReviews ? Number(product.ratings).toFixed(1) : 'New'}</span>
                            <span id="no_of_reviews">({product.numOfReviews} {product.numOfReviews === 1 ? 'review' : 'reviews'})</span>
                        </div>

                        <p id="product_price">{hasSizes && 'From '}{formatPeso(price)}</p>

                        {hasSizes && (
                            <div className="product-option-group">
                                <h2>Choose a size</h2>
                                <div className="product-size-options">
                                    {product.sizes.map(s => (
                                        <button
                                            key={s.name}
                                            type="button"
                                            className={`product-size-option${size === s.name ? ' is-selected' : ''}`}
                                            aria-pressed={size === s.name}
                                            onClick={() => setSize(s.name)}
                                        >
                                            <span>{s.name}</span>
                                            <small>{formatPeso(s.price)}</small>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="product-purchase">
                            <div className="product-quantity">
                                <span className="product-option-label">Quantity</span>
                                <div className="quantity-control">
                                    <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                                    <span aria-live="polite">{quantity}</span>
                                    <button type="button" aria-label="Increase quantity" disabled={!info.available || quantity >= product.stock} onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
                                </div>
                            </div>
                            <button
                                type="button"
                                id="cart_btn"
                                className="btn btn-primary"
                                disabled={!info.available}
                                onClick={addToCart}
                            >
                                <i className="fa fa-shopping-bag" aria-hidden="true"></i>
                                {info.available ? 'Add to Cart' : 'Unavailable'}
                            </button>
                        </div>

                        <div className="product-meta">
                            <p>Status <span id="stock_status" className={info.className}><b>{info.label}</b></span></p>
                            <p>Sold by <strong>{product.seller}</strong></p>
                        </div>

                    </div>
                </section>

                <section className="product-information">
                    <div className="product-description">
                        <span className="product-section-eyebrow">A little more about it</span>
                        <h2>Made to make someone smile</h2>
                        <p>{product.description}</p>
                    </div>
                    <div className="product-review-area">
                        <div className="product-review-heading">
                            <div>
                                <span className="product-section-eyebrow">Kind words from customers</span>
                                <h2>Reviews</h2>
                            </div>
                            {product.numOfReviews > 0 && (
                                <span className="product-review-summary">
                                    <span className="rating-outer">
                                        <span className="rating-inner" style={{ width: `${(product.ratings / 5) * 100}%` }}></span>
                                    </span>
                                    {Number(product.ratings).toFixed(1)} / 5
                                </span>
                            )}
                        </div>

                        {!user && <p className="review-guidance">Log in to see whether you can review this product.</p>}
                        {user && !canReview && (
                            <p className="review-guidance">Reviews are open to customers who have received this product.</p>
                        )}

                        {showForm && (
                            <div className="review-form">
                                <h3>{comment ? 'Edit your review' : 'Your review'}</h3>
                                <div className="review-star-picker" role="group" aria-label="Choose a star rating">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            aria-label={`${n} star${n === 1 ? '' : 's'}`}
                                            aria-pressed={rating === n}
                                            onMouseEnter={() => setHover(n)}
                                            onMouseLeave={() => setHover(0)}
                                            onClick={() => setRating(n)}
                                        >
                                            <i className="fa fa-star" style={{ color: n <= (hover || rating) ? '#d9a441' : '#d7d1ce' }} aria-hidden="true"></i>
                                        </button>
                                    ))}
                                </div>
                                <textarea className="form-control" rows="4" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How were the flowers?" />
                                <div className="review-form-actions">
                                    <button className="btn btn-primary" disabled={sending} onClick={submitReview}>Submit review</button>
                                    <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {user && canReview && !showForm && (
                            <button id="review_btn" type="button" className="btn btn-primary product-write-review" onClick={() => setShowForm(true)}>
                                {comment ? 'Edit your review' : 'Write a review'}
                            </button>
                        )}

                        {product.reviews && product.reviews.length > 0 ? (
                            <ListReviews reviews={product.reviews} />
                        ) : (
                            <p className="review-guidance">No reviews yet. Be the first to share your experience.</p>
                        )}
                    </div>
                </section>
            </main>
        </>
    )
}

export default ProductDetails
