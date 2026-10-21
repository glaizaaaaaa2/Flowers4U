import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import Swal from 'sweetalert2'
import { getToken } from '../Utils/helpers'
import axios from 'axios'
import { toast } from 'react-toastify'

const ProductReviews = () => {
    const [loading, setLoading] = useState(true)
    const [reviews, setReviews] = useState([])
    const [loadError, setLoadError] = useState('')
    const [search, setSearch] = useState('')
    const [ratingFilter, setRatingFilter] = useState('All ratings')
    const [deletingId, setDeletingId] = useState('')

    const headers = useMemo(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
    }), [])

    const loadReviews = useCallback(async () => {
        setLoadError('')
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/reviews`, { headers })
            setReviews(data.reviews)
        } catch (error) {
            const message = error.response?.data?.message || error.message
            setLoadError(message)
            toast.error(message, { position: 'bottom-right' })
        } finally {
            setLoading(false)
        }
    }, [headers])

    useEffect(() => {
        const request = window.setTimeout(loadReviews, 0)
        return () => window.clearTimeout(request)
    }, [loadReviews])

    const deleteReview = async (review) => {
        setDeletingId(review._id)
        try {
            await axios.delete(`${import.meta.env.VITE_API}/reviews?id=${review._id}&productId=${review.productId}`, { headers })
            setReviews(current => current.filter(item => item._id !== review._id))
            toast.success('Review deleted successfully', { position: 'bottom-right' })
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        } finally {
            setDeletingId('')
        }
    }

    const confirmDelete = async (review) => {
        const result = await Swal.fire({
            title: 'Delete this review?',
            text: 'This will permanently remove the review from the product.',
            icon: 'warning',
            confirmButtonText: 'Delete review',
            showCancelButton: true,
            confirmButtonColor: '#a8486a',
            cancelButtonColor: '#5f7066'
        })
        if (result.isConfirmed) await deleteReview(review)
    }

    const filteredReviews = useMemo(() => {
        const query = search.trim().toLowerCase()
        return reviews
            .filter(review => {
                const matchesRating = ratingFilter === 'All ratings' || review.rating === Number(ratingFilter)
                const matchesSearch = !query || [
                    review.productName,
                    review.name,
                    review.comment
                ].some(value => String(value || '').toLowerCase().includes(query))
                return matchesRating && matchesSearch
            })
            .sort((first, second) => {
                const firstDate = Date.parse(first.createdAt || '')
                const secondDate = Date.parse(second.createdAt || '')
                return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0)
            })
    }, [ratingFilter, reviews, search])

    const averageRating = reviews.length
        ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
        : 0
    const positiveCount = reviews.filter(review => Number(review.rating) >= 4).length

    return (
        <>
            <MetaData title="Product Reviews" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <main className="admin-reviews-page">
                        <header className="admin-reviews-heading">
                            <div>
                                <span className="admin-reviews-eyebrow">Shop management</span>
                                <h1>Product reviews</h1>
                                <p>Read customer feedback and keep your product reviews tidy.</p>
                            </div>
                            <span className="admin-reviews-total">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
                        </header>

                        {!loading && !loadError && (
                            <div className="admin-reviews-stats">
                                <div className="admin-review-stat">
                                    <span className="admin-review-stat-icon"><i className="fa fa-comments-o" aria-hidden="true"></i></span>
                                    <span><strong>{reviews.length}</strong><small>Total reviews</small></span>
                                </div>
                                <div className="admin-review-stat">
                                    <span className="admin-review-stat-icon is-gold"><i className="fa fa-star" aria-hidden="true"></i></span>
                                    <span><strong>{averageRating.toFixed(1)} / 5</strong><small>Average rating</small></span>
                                </div>
                                <div className="admin-review-stat">
                                    <span className="admin-review-stat-icon is-green"><i className="fa fa-heart" aria-hidden="true"></i></span>
                                    <span><strong>{positiveCount}</strong><small>4+ star reviews</small></span>
                                </div>
                            </div>
                        )}

                        <section className="admin-reviews-panel">
                            <div className="admin-reviews-toolbar">
                                <div>
                                    <h2>Customer feedback</h2>
                                    <p>{loading ? 'Loading reviews…' : `${filteredReviews.length} ${filteredReviews.length === 1 ? 'review' : 'reviews'} shown`}</p>
                                </div>
                                <div className="admin-reviews-filters">
                                    <label className="admin-reviews-search">
                                        <i className="fa fa-search" aria-hidden="true"></i>
                                        <span className="sr-only">Search reviews</span>
                                        <input
                                            type="search"
                                            placeholder="Search product, customer, or comment"
                                            value={search}
                                            onChange={event => setSearch(event.target.value)}
                                        />
                                    </label>
                                    <label className="admin-reviews-rating-filter">
                                        <span className="sr-only">Filter by star rating</span>
                                        <select value={ratingFilter} onChange={event => setRatingFilter(event.target.value)}>
                                            <option>All ratings</option>
                                            {[5, 4, 3, 2, 1].map(rating => <option key={rating} value={rating}>{rating} stars</option>)}
                                        </select>
                                    </label>
                                </div>
                            </div>

                            {loading ? <Loader /> : loadError ? (
                                <div className="admin-reviews-message is-error" role="alert">
                                    <p>{loadError}</p>
                                    <button type="button" onClick={() => { setLoading(true); loadReviews() }}>Try again</button>
                                </div>
                            ) : filteredReviews.length === 0 ? (
                                <div className="admin-reviews-message">
                                    <span className="admin-reviews-empty-icon"><i className="fa fa-comments-o" aria-hidden="true"></i></span>
                                    <h3>{reviews.length === 0 ? 'No reviews yet' : 'No matching reviews'}</h3>
                                    <p>{reviews.length === 0 ? 'Customer reviews will appear here as they share their experiences.' : 'Try another search or rating filter.'}</p>
                                </div>
                            ) : (
                                <div className="admin-review-list">
                                    {filteredReviews.map(review => (
                                        <article className="admin-review-card" key={review._id}>
                                            <div className="admin-review-card-heading">
                                                <span className="admin-review-avatar" aria-hidden="true">{review.name?.charAt(0)?.toUpperCase() || '?'}</span>
                                                <div className="admin-review-author">
                                                    <strong>{review.name || 'Customer'}</strong>
                                                    <span>Reviewed <Link to={`/product/${review.productId}`}>{review.productName || 'Product'}</Link></span>
                                                    <span>{review.createdAt ? `Submitted ${new Date(review.createdAt).toLocaleString('en-PH')}` : 'Submission date unavailable'}</span>
                                                </div>
                                                <span className="admin-review-rating" aria-label={`${review.rating} out of 5 stars`}>
                                                    <span aria-hidden="true">{'★'.repeat(Number(review.rating) || 0)}{'☆'.repeat(Math.max(0, 5 - (Number(review.rating) || 0)))}</span>
                                                    <strong>{review.rating}/5</strong>
                                                </span>
                                            </div>
                                            <p className="admin-review-comment">{review.comment || 'No written comment.'}</p>
                                            <div className="admin-review-card-footer">
                                                <span className="admin-review-product-link">
                                                    <i className="fa fa-leaf" aria-hidden="true"></i>
                                                    {review.productName || 'Product review'}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="admin-review-delete"
                                                    disabled={deletingId === review._id}
                                                    onClick={() => confirmDelete(review)}
                                                >
                                                    <i className="fa fa-trash-o" aria-hidden="true"></i>
                                                    {deletingId === review._id ? 'Deleting…' : 'Delete review'}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>
        </>
    )
}

export default ProductReviews
