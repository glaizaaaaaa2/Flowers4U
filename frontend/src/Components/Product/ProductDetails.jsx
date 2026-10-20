import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
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
            if (data.review) { setRating(data.review.rating); setComment(data.review.comment) }
        } catch (e) {
            setCanReview(false)
        }
    }
    useEffect(() => { loadReviewAccess() }, [id, user])

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
            <div className="mb-3">
                <Link to="/" className="btn btn-outline-secondary mt-4 mb-3">
                    <i className="fa fa-arrow-left mr-2" aria-hidden="true"></i>
                    Back to Products
                </Link>
            </div>
            <div className="row d-flex justify-content-around">
                <div className="col-12 col-lg-5" id="product_image">
                    {/* fixed-ratio frame: every product photo is cropped to the same size */}
                    <div className="product-gallery">
                        {product.images && product.images.length > 0 ? (
                            <Carousel pause='hover' interval={null} indicators={product.images.length > 1} controls={product.images.length > 1}>
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

                <div className="col-12 col-lg-5 mt-5">
                    <h3>{product.name}</h3>
                    <p id="product_id">Product # {product._id}</p>
                    <p className="text-muted">Category: {product.category}</p>

                    <hr />
                    <div className="rating-outer">
                        <div className="rating-inner" style={{ width: `${(product.ratings / 5) * 100}%` }}></div>
                    </div>
                    <span id="no_of_reviews">({product.numOfReviews} Reviews)</span>
                    <hr />

                    <p id="product_price">{formatPeso(price)}</p>

                    {hasSizes && (
                        <div className="mb-3">
                            <b>Size:</b>
                            <div className="mt-2">
                                {product.sizes.map(s => (
                                    <button
                                        key={s.name}
                                        type="button"
                                        className={`btn mr-2 mb-2 ${size === s.name ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => setSize(s.name)}
                                    >
                                        {s.name} - {formatPeso(s.price)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="stockCounter d-inline">
                        <span className="btn btn-danger minus" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</span>
                        <input type="number" className="form-control count d-inline" value={quantity} readOnly />
                        <span className="btn btn-primary plus" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</span>
                    </div>

                    <button
                        type="button"
                        id="cart_btn"
                        className="btn btn-primary d-inline ml-4"
                        disabled={!info.available}
                        onClick={addToCart}
                    >
                        {info.available ? 'Add to Cart' : 'Unavailable'}
                    </button>
                    <hr />

                    <p>Status: <span id="stock_status" className={info.className}><b>{info.label}</b></span></p>
                    <hr />

                    <h4 className="mt-2">Description:</h4>
                    <p>{product.description}</p>
                    <hr />
                    <p id="product_seller mb-3">Sold by: <strong>{product.seller}</strong></p>

                    {/* ---- reviews ---- */}
                    {!user && <div className="alert alert-info mt-4">Login to see if you can review this product.</div>}
                    {user && !canReview && (
                        <div className="alert alert-secondary mt-4">
                            Only customers who have received this product can review it.
                        </div>
                    )}
                    {user && canReview && !showForm && (
                        <button id="review_btn" type="button" className="btn btn-primary mt-4" onClick={() => setShowForm(true)}>
                            {comment ? 'Edit Your Review' : 'Submit Your Review'}
                        </button>
                    )}
                    {showForm && (
                        <div className="card p-3 mt-4 mb-4">
                            <h5>Your review</h5>
                            <div className="mb-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <i
                                        key={n}
                                        className="fa fa-star fa-2x"
                                        style={{ cursor: 'pointer', color: n <= (hover || rating) ? '#fdcc0d' : '#ccc' }}
                                        onMouseEnter={() => setHover(n)}
                                        onMouseLeave={() => setHover(0)}
                                        onClick={() => setRating(n)}
                                    ></i>
                                ))}
                            </div>
                            <textarea className="form-control" rows="4" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How were the flowers?" />
                            <div className="mt-3">
                                <button className="btn btn-primary mr-2" disabled={sending} onClick={submitReview}>Submit</button>
                                <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {product.reviews && product.reviews.length > 0 && (
                        <ListReviews reviews={product.reviews} />
                    )}
                </div>
            </div>
        </>
    )
}

export default ProductDetails
