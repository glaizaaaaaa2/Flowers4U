import React from 'react'
import { Link } from 'react-router-dom';
import { stockInfo, priceFrom, formatPeso } from '../Utils/helpers';

const Product = ({ product, lowStockThreshold }) => {
    const info = stockInfo(product, lowStockThreshold)
    const hasSizes = product.sizes && product.sizes.length > 0
    return (
        <div className="col-sm-12 col-md-6 col-lg-3 my-3">
            <div className="card p-3 rounded" style={info.available ? {} : { opacity: 0.7 }}>
                <img
                    className="card-img-top mx-auto"
                    src={product.images && product.images[0] ? product.images[0].url : ''}
                    alt={product.name}
                />
                <div className="card-body d-flex flex-column">
                    <h5 className="card-title">
                        <Link to={`/product/${product._id}`} >{product.name}</Link>
                    </h5>
                    <small className="text-muted">{product.category}</small>
                    <div className="ratings mt-auto">
                        <div className="rating-outer">
                            <div className="rating-inner" style={{ width: `${(product.ratings / 5) * 100}%` }}></div>
                        </div>
                        <span id="no_of_reviews">({product.numOfReviews} reviews)</span>
                    </div>
                    <p className="card-text mb-1">{hasSizes ? 'From ' : ''}{formatPeso(priceFrom(product))}</p>
                    {(!info.available || info.low) && <small className={info.className}><b>{info.label}</b></small>}
                    <Link to={`/product/${product._id}`} id="view_btn" className="btn btn-block mt-2">View Details</Link>
                </div>
            </div>
        </div>
    )
}

export default Product
