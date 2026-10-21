import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Product from './Product/Product'
import MetaData from './Layout/MetaData'
import Loader from './Layout/Loader';
import useCategories from '../hooks/useCategories'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { getProducts, clearErrors } from '../actions/productActions'

const Home = () => {
    const [price, setPrice] = useState(['', '']);          // applied range
    const [minInput, setMinInput] = useState('');            // what the shopper is typing
    const [maxInput, setMaxInput] = useState('');
    const [category, setCategory] = useState('')
    const [rating, setRating] = useState(0)
    const [minReviews, setMinReviews] = useState(0)
    const [pageState, setPageState] = useState({ filterKey: '', page: 1 })
    const loadMoreRef = useRef(null)
    const loadRequestActive = useRef(false)
    const [failedLoad, setFailedLoad] = useState(null)
    const { keyword } = useParams();
    const dispatch = useDispatch();
    const { loading, isLoadingMore, error, products = [], productsCount, filteredProductsCount, lowStockThreshold } = useSelector(state => state.products);
    const { categories } = useCategories()
    const filterKey = JSON.stringify([keyword, price, category, rating, minReviews])
    const currentPage = pageState.filterKey === filterKey ? pageState.page : 1

    // filteredProductsCount already reflects all active filters
    const count = filteredProductsCount ?? productsCount ?? 0;

    useEffect(() => {
        loadRequestActive.current = true
        dispatch(getProducts(currentPage, keyword, price, category, rating, currentPage > 1, minReviews))
            .then(success => {
                loadRequestActive.current = false
                if (!success && currentPage > 1) setFailedLoad({ filterKey, page: currentPage })
            })
    }, [dispatch, currentPage, filterKey, keyword, price, category, rating, minReviews])

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
    }, [error, dispatch, currentPage])

    useEffect(() => {
        const sentinel = loadMoreRef.current
        if (!sentinel || typeof IntersectionObserver === 'undefined' || error) return

        const observer = new IntersectionObserver(([entry]) => {
            if (
                entry.isIntersecting &&
                !loading &&
                !isLoadingMore &&
                !loadRequestActive.current &&
                !(failedLoad?.filterKey === filterKey && failedLoad.page === currentPage) &&
                products.length < count
            ) {
                loadRequestActive.current = true
                setPageState({ filterKey, page: currentPage + 1 })
            }
        }, { rootMargin: '300px' })

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [count, currentPage, error, failedLoad, filterKey, isLoadingMore, loading, products.length])

    const retryLoadMore = () => {
        setFailedLoad(null)
        loadRequestActive.current = true
        dispatch(getProducts(currentPage, keyword, price, category, rating, true, minReviews))
            .then(success => {
                loadRequestActive.current = false
                if (!success) setFailedLoad({ filterKey, page: currentPage })
            })
    }

    const [priceError, setPriceError] = useState('')
    const priceActive = price[0] !== '' || price[1] !== ''

    // digits with an optional decimal point only
    const onlyNumber = (value) => /^\d*\.?\d{0,2}$/.test(value) ? value : null

    const applyPrice = (e) => {
        e.preventDefault()
        const min = minInput === '' ? '' : Number(minInput)
        const max = maxInput === '' ? '' : Number(maxInput)
        if (min !== '' && max !== '' && min > max) {
            setPriceError('Minimum price cannot be more than the maximum.')
            return
        }
        setPriceError('')
        setPrice([min, max])
    }

    const clearPrice = () => {
        setMinInput(''); setMaxInput(''); setPriceError(''); setPrice(['', ''])
    }

    return (
        <>
            <MetaData title={'Fresh Flowers'} />
            <main className="shop-page container-fluid">
                <header className="shop-heading">
                    <div>
                        <p className="shop-eyebrow">A little joy, freshly picked</p>
                        <h1 id="products_heading">{keyword ? `Results for "${keyword}"` : 'Fresh Blooms'}</h1>
                    </div>
                    <p className="shop-result-count" aria-live="polite">
                        {count} {count === 1 ? 'flower' : 'flowers'}
                    </p>
                </header>
                <section id="products" className="shop-content">
                    <div className="filter-panel">
                        <div className="filter-panel-heading">
                            <div>
                                <span className="filter-eyebrow">Find your perfect bouquet</span>
                                <h2>Filter flowers</h2>
                            </div>
                            {(priceActive || category || rating || minReviews) && (
                                <button
                                    type="button"
                                    className="filter-reset"
                                    onClick={() => {
                                        clearPrice()
                                        setCategory('')
                                        setRating(0)
                                        setMinReviews(0)
                                    }}
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="filter-categories">
                            <h3>Category</h3>
                            <div className="filter-chips">
                                <button type="button" className={`filter-chip${category === '' ? ' is-active' : ''}`} aria-pressed={category === ''} onClick={() => setCategory('')}>All flowers</button>
                                {categories.map(c => (
                                    <button key={c._id} type="button" className={`filter-chip${category === c.name ? ' is-active' : ''}`} aria-pressed={category === c.name} onClick={() => setCategory(c.name)}>
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-controls">
                            <div className="filter-group">
                                <h3>Price range</h3>
                                <form className="price-filter" onSubmit={applyPrice} noValidate>
                                    <div className="price-fields">
                                        <label className="price-field">
                                            <span className="sr-only">Minimum price</span>
                                            <span className="price-prefix" aria-hidden="true">₱</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className="form-control"
                                                placeholder="Min"
                                                value={minInput}
                                                onChange={(e) => { const v = onlyNumber(e.target.value); if (v !== null) setMinInput(v) }}
                                            />
                                        </label>
                                        <span className="price-dash" aria-hidden="true">to</span>
                                        <label className="price-field">
                                            <span className="sr-only">Maximum price</span>
                                            <span className="price-prefix" aria-hidden="true">₱</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className="form-control"
                                                placeholder="Max"
                                                value={maxInput}
                                                onChange={(e) => { const v = onlyNumber(e.target.value); if (v !== null) setMaxInput(v) }}
                                            />
                                        </label>
                                    </div>
                                    {priceError && <p className="price-error" role="alert">{priceError}</p>}
                                    <div className="price-actions">
                                        <button type="submit" className="btn btn-primary btn-sm">Apply</button>
                                        {(priceActive || minInput || maxInput) && (
                                            <button type="button" className="btn btn-link btn-sm" onClick={clearPrice}>Clear</button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="filter-group">
                                <h3>Customer rating</h3>
                                <div className="filter-chips">
                                    <button type="button" className={`filter-chip${rating === 0 ? ' is-active' : ''}`} aria-pressed={rating === 0} onClick={() => setRating(0)}>Any rating</button>
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <button key={star} type="button" className={`filter-chip rating-chip${rating === star ? ' is-active' : ''}`} aria-pressed={rating === star} onClick={() => setRating(star)}>
                                            <span className="rating-filter-stars" role="img" aria-label={`${star} stars and up`}>
                                                {Array.from({ length: 5 }, (_, index) => (
                                                    <span key={index} className={index < star ? 'is-filled' : ''} aria-hidden="true">
                                                        {index < star ? '★' : '☆'}
                                                    </span>
                                                ))}
                                            </span>
                                            {star < 5 && <span>&amp; up</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <h3>Number of reviews</h3>
                                <div className="filter-chips">
                                    {[
                                        { value: 0, label: 'Any' },
                                        { value: 1, label: 'With reviews' },
                                        { value: 5, label: '5+ reviews' },
                                        { value: 10, label: '10+ reviews' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={`filter-chip${minReviews === option.value ? ' is-active' : ''}`}
                                            aria-pressed={minReviews === option.value}
                                            onClick={() => setMinReviews(option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shop-results">
                        {loading && products.length === 0 ? <Loader /> : (
                            <div className="row">
                                {!loading && products.length === 0 && (
                                    <div className="col-12">
                                        <div className="shop-empty-state">
                                            <h2>No flowers found</h2>
                                            <p>Try changing your filters to discover more blooms.</p>
                                        </div>
                                    </div>
                                )}
                                {products.map(product => (
                                    <Product key={product._id} product={product} lowStockThreshold={lowStockThreshold} />
                                ))}
                            </div>
                        )}
                        {products.length > 0 && products.length < count && !error && (
                            <div ref={loadMoreRef} className="shop-load-more" aria-live="polite">
                                {isLoadingMore && <span>Loading more flowers...</span>}
                                {typeof IntersectionObserver === 'undefined' && !loading && (
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setPageState({ filterKey, page: currentPage + 1 })}>
                                        Load more flowers
                                    </button>
                                )}
                            </div>
                        )}
                        {products.length > 0 && failedLoad?.filterKey === filterKey && failedLoad.page === currentPage && (
                            <div className="shop-load-more">
                                <button type="button" className="btn btn-outline-secondary" onClick={retryLoadMore}>
                                    Retry loading flowers
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </>
    )
}

export default Home
