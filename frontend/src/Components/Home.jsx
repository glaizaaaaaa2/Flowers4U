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
    const [pageState, setPageState] = useState({ filterKey: '', page: 1 })
    const loadMoreRef = useRef(null)
    const loadRequestActive = useRef(false)
    const [failedLoad, setFailedLoad] = useState(null)
    const { keyword } = useParams();
    const dispatch = useDispatch();
    const { loading, isLoadingMore, error, products = [], productsCount, filteredProductsCount, lowStockThreshold } = useSelector(state => state.products);
    const { categories } = useCategories()
    const filterKey = JSON.stringify([keyword, price, category, rating])
    const currentPage = pageState.filterKey === filterKey ? pageState.page : 1

    // filteredProductsCount already reflects keyword, price, category and rating filters
    const count = filteredProductsCount ?? productsCount ?? 0;

    useEffect(() => {
        loadRequestActive.current = true
        dispatch(getProducts(currentPage, keyword, price, category, rating, currentPage > 1))
            .then(success => {
                loadRequestActive.current = false
                if (!success && currentPage > 1) setFailedLoad({ filterKey, page: currentPage })
            })
    }, [dispatch, currentPage, filterKey, keyword, price, category, rating])

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
        dispatch(getProducts(currentPage, keyword, price, category, rating, true))
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
            <div className="container container-fluid">
                <h1 id="products_heading">{keyword ? `Results for "${keyword}"` : 'Fresh Blooms'}</h1>
                <section id="products" className="container mt-5">
                    <div className="row">
                        <div className="col-12 col-md-4 col-lg-3 mt-5 mb-5"><div className="filter-panel">
                            <h4 className="mb-3">Price</h4>
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

                            <div className="mt-5">
                                <h4 className="mb-3">Categories</h4>
                                <ul className="filter-list">
                                    <li>
                                        <button type="button" className={`filter-option${category === '' ? ' is-active' : ''}`} aria-pressed={category === ''} onClick={() => setCategory('')}>All Flowers</button>
                                    </li>
                                    {categories.map(c => (
                                        <li key={c._id}>
                                            <button type="button" className={`filter-option${category === c.name ? ' is-active' : ''}`} aria-pressed={category === c.name} onClick={() => setCategory(c.name)}>
                                                {c.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-5">
                                <h4 className="mb-3">Ratings</h4>
                                <ul className="filter-list">
                                    <li>
                                        <button type="button" className={`filter-option${rating === 0 ? ' is-active' : ''}`} aria-pressed={rating === 0} onClick={() => setRating(0)}>Any rating</button>
                                    </li>
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <li key={star}>
                                            <button type="button" className={`filter-option${rating === star ? ' is-active' : ''}`} aria-pressed={rating === star} onClick={() => setRating(star)}>
                                                <span className="rating-outer d-inline-block">
                                                    <span className="rating-inner" style={{ width: `${star * 20}%`, display: 'block' }}></span>
                                                </span>
                                                <small className="ml-1">{star < 5 ? '& up' : ''}</small>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>                        </div>

                        <div className="col-12 col-md-8 col-lg-9">
                            {loading && products.length === 0 ? <Loader /> : (
                                <div className="row">
                                    {!loading && products.length === 0 && <p className="mt-5 ml-3">No flowers found. Try changing the filters.</p>}
                                    {products.map(product => (
                                        <Product key={product._id} product={product} lowStockThreshold={lowStockThreshold} />
                                    ))}
                                </div>
                            )}
                            {products.length > 0 && products.length < count && !error && (
                                <div ref={loadMoreRef} className="d-flex justify-content-center mt-4" aria-live="polite">
                                    {isLoadingMore && <span>Loading more flowers...</span>}
                                    {typeof IntersectionObserver === 'undefined' && !loading && (
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setPageState({ filterKey, page: currentPage + 1 })}>
                                            Load more flowers
                                        </button>
                                    )}
                                </div>
                            )}
                            {products.length > 0 && failedLoad?.filterKey === filterKey && failedLoad.page === currentPage && (
                                <div className="d-flex justify-content-center mt-4">
                                    <button type="button" className="btn btn-outline-secondary" onClick={retryLoadMore}>
                                        Retry loading flowers
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}

export default Home
