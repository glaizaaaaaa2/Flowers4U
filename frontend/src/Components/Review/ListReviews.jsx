const ListReviews = ({ reviews }) => {
    return (
        <div className="reviews-list">
            {reviews && reviews.map(review => (
                <article key={review._id} className="review-card">
                    <div className="review-card-heading">
                        <div className="review-avatar" aria-hidden="true">{review.name?.charAt(0)?.toUpperCase() || '?'}</div>
                        <div>
                            <p className="review_user">{review.name}</p>
                            <div className="rating-outer" aria-label={`${review.rating} out of 5 stars`}>
                                <div className="rating-inner" style={{ width: `${(review.rating / 5) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <p className="review_comment">{review.comment}</p>
                </article>
            ))}
        </div>
    )

}



export default ListReviews