import { formatDateTime } from '../Utils/helpers'

const ListReviews = ({ reviews }) => {
    const sortedReviews = [...(reviews || [])].sort((first, second) => {
        const firstDate = Date.parse(first.createdAt || '')
        const secondDate = Date.parse(second.createdAt || '')
        return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0)
    })

    return (
        <div className="reviews-list">
            {sortedReviews.map(review => (
                <article key={review._id} className="review-card">
                    <div className="review-card-heading">
                        <div className="review-avatar" aria-hidden="true">{review.name?.charAt(0)?.toUpperCase() || '?'}</div>
                        <div>
                            <p className="review_user">{review.name}</p>
                            <div className="rating-outer" aria-label={`${review.rating} out of 5 stars`}>
                                <div className="rating-inner" style={{ width: `${(review.rating / 5) * 100}%` }}></div>
                            </div>
                            <time className="review-submitted-date" dateTime={review.createdAt || undefined}>
                                {review.createdAt ? `Submitted ${formatDateTime(review.createdAt)}` : 'Submission date unavailable'}
                            </time>
                        </div>
                    </div>
                    <p className="review_comment">{review.comment}</p>
                </article>
            ))}
        </div>
    )

}



export default ListReviews