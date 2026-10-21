import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { stockInfo, formatPeso } from '../Utils/helpers'

const getProductStatus = (product, threshold) => {
    const info = stockInfo(product, threshold)
    if (!info.available) {
        return {
            label: product.stock <= 0 ? 'Out of stock' : 'Unavailable',
            className: 'admin-product-status is-unavailable'
        }
    }
    if (info.low) return { label: 'Low stock', className: 'admin-product-status is-low' }
    return { label: 'In stock', className: 'admin-product-status is-available' }
}

const ProductsList = () => {
    const [products, setProducts] = useState([])
    const [threshold, setThreshold] = useState(10)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [selection, setSelection] = useState(() => new Set())
    const [busyProductId, setBusyProductId] = useState('')
    const [deletingSelected, setDeletingSelected] = useState(false)

    const fetchProducts = useCallback(async () => {
        setLoadError('')
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/products`)
            setProducts(data.products)
            setThreshold(data.lowStockThreshold)
        } catch (error) {
            const message = error.response?.data?.message || error.message
            setLoadError(message)
            toast.error(message, { position: 'bottom-right' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const request = window.setTimeout(fetchProducts, 0)
        return () => window.clearTimeout(request)
    }, [fetchProducts])

    const deleteProduct = async (id) => {
        if (!window.confirm('Delete this product?')) return
        setBusyProductId(id)
        try {
            await axios.delete(`${import.meta.env.VITE_API}/admin/product/${id}`)
            setProducts(current => current.filter(product => product._id !== id))
            setSelection(current => {
                const next = new Set(current)
                next.delete(id)
                return next
            })
            toast.success('Product deleted successfully', { position: 'bottom-right' })
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        } finally {
            setBusyProductId('')
        }
    }

    const bulkDeleteProducts = async () => {
        const ids = [...selection].map(String)
        if (ids.length === 0) return
        if (!window.confirm(`Delete ${ids.length} selected product${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return

        setDeletingSelected(true)
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API}/admin/products/bulk-delete`, { ids })
            toast.success(`${data.deletedCount} product${data.deletedCount === 1 ? '' : 's'} deleted successfully`, { position: 'bottom-right' })
            setSelection(new Set())
            await fetchProducts()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        } finally {
            setDeletingSelected(false)
        }
    }

    const toggleAvailability = async (product) => {
        setBusyProductId(product._id)
        try {
            const isAvailable = !(product.isAvailable !== false)
            await axios.put(`${import.meta.env.VITE_API}/admin/product/${product._id}`, { isAvailable })
            setProducts(current => current.map(item => item._id === product._id ? { ...item, isAvailable } : item))
            toast.success(isAvailable ? 'Product is now available' : 'Product is now unavailable', { position: 'bottom-right' })
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        } finally {
            setBusyProductId('')
        }
    }

    const lowCount = products.filter(product => stockInfo(product, threshold).low).length
    const unavailableCount = products.filter(product => !stockInfo(product, threshold).available).length
    const availableCount = products.length - unavailableCount

    const shown = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()
        return products.filter(product => {
            const info = stockInfo(product, threshold)
            const matchesFilter = filter === 'low'
                ? info.low
                : filter === 'unavailable'
                    ? !info.available
                    : true
            const matchesSearch = !normalizedSearch ||
                [product.name, product.category, product.seller].some(value =>
                    String(value || '').toLowerCase().includes(normalizedSearch)
                )
            return matchesFilter && matchesSearch
        })
    }, [filter, products, search, threshold])

    const allShownSelected = shown.length > 0 && shown.every(product => selection.has(product._id))

    const toggleSelection = (id) => {
        setSelection(current => {
            const next = new Set(current)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelectShown = () => {
        setSelection(current => {
            const next = new Set(current)
            if (allShownSelected) shown.forEach(product => next.delete(product._id))
            else shown.forEach(product => next.add(product._id))
            return next
        })
    }

    const tabs = [
        { key: 'all', label: 'All products', count: products.length },
        { key: 'low', label: 'Low stock', count: lowCount },
        { key: 'unavailable', label: 'Unavailable', count: unavailableCount }
    ]

    return (
        <>
            <MetaData title="Products & Inventory" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <main className="admin-products-page">
                        <header className="admin-products-heading">
                            <div>
                                <span className="admin-products-eyebrow">Shop management</span>
                                <h1>Products &amp; Inventory</h1>
                                <p>Keep your flower catalog fresh and your stock in check.</p>
                            </div>
                            <Link to="/admin/product" className="admin-products-add">
                                <i className="fa fa-plus" aria-hidden="true"></i>
                                Add product
                            </Link>
                        </header>

                        {!loading && !loadError && (
                            <div className="admin-products-stats">
                                <div className="admin-products-stat">
                                    <span className="admin-products-stat-icon"><i className="fa fa-leaf" aria-hidden="true"></i></span>
                                    <span><strong>{products.length}</strong><small>Total products</small></span>
                                </div>
                                <div className="admin-products-stat">
                                    <span className="admin-products-stat-icon is-green"><i className="fa fa-check" aria-hidden="true"></i></span>
                                    <span><strong>{availableCount}</strong><small>Available</small></span>
                                </div>
                                <div className="admin-products-stat">
                                    <span className="admin-products-stat-icon is-amber"><i className="fa fa-exclamation" aria-hidden="true"></i></span>
                                    <span><strong>{lowCount}</strong><small>Low stock</small></span>
                                </div>
                                <div className="admin-products-stat">
                                    <span className="admin-products-stat-icon is-muted"><i className="fa fa-eye-slash" aria-hidden="true"></i></span>
                                    <span><strong>{unavailableCount}</strong><small>Unavailable</small></span>
                                </div>
                            </div>
                        )}

                        <section className="admin-products-panel">
                            <div className="admin-products-toolbar">
                                <div>
                                    <h2>Catalog</h2>
                                    <p>Low stock means {threshold} or fewer in inventory.</p>
                                </div>
                                <label className="admin-products-search">
                                    <i className="fa fa-search" aria-hidden="true"></i>
                                    <span className="sr-only">Search products</span>
                                    <input
                                        type="search"
                                        placeholder="Search products or categories"
                                        value={search}
                                        onChange={event => setSearch(event.target.value)}
                                    />
                                </label>
                            </div>

                            <div className="admin-products-controls">
                                <div className="admin-products-tabs" role="group" aria-label="Filter products">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            className={`admin-products-tab${filter === tab.key ? ' is-active' : ''}`}
                                            aria-pressed={filter === tab.key}
                                            onClick={() => setFilter(tab.key)}
                                        >
                                            {tab.label}<span>{tab.count}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="admin-products-bulk">
                                    <label className="admin-products-select-all">
                                        <input type="checkbox" checked={allShownSelected} onChange={toggleSelectShown} disabled={shown.length === 0} />
                                        Select shown
                                    </label>
                                    <button type="button" className="admin-products-bulk-delete" disabled={selection.size === 0 || deletingSelected} onClick={bulkDeleteProducts}>
                                        <i className="fa fa-trash-o" aria-hidden="true"></i>
                                        {deletingSelected ? 'Deleting…' : `Delete selected${selection.size ? ` (${selection.size})` : ''}`}
                                    </button>
                                </div>
                            </div>

                            {loading ? <Loader /> : loadError ? (
                                <div className="admin-products-message is-error" role="alert">
                                    <p>{loadError}</p>
                                    <button type="button" onClick={() => { setLoading(true); fetchProducts() }}>Try again</button>
                                </div>
                            ) : shown.length === 0 ? (
                                <div className="admin-products-message">
                                    <span className="admin-products-empty-icon"><i className="fa fa-leaf" aria-hidden="true"></i></span>
                                    <h3>{products.length === 0 ? 'Your catalog is ready to grow' : 'No matching products'}</h3>
                                    <p>{products.length === 0 ? 'Add your first product to start building your flower catalog.' : 'Try a different search or inventory filter.'}</p>
                                    {products.length === 0 && <Link to="/admin/product" className="admin-products-add">Add your first product</Link>}
                                </div>
                            ) : (
                                <div className="admin-product-list">
                                    {shown.map(product => {
                                        const status = getProductStatus(product, threshold)
                                        const price = product.sizes?.length
                                            ? `From ${formatPeso(Math.min(...product.sizes.map(size => size.price)))}`
                                            : formatPeso(product.price)
                                        const isAvailable = product.isAvailable !== false

                                        return (
                                            <article className={`admin-product-card${selection.has(product._id) ? ' is-selected' : ''}`} key={product._id}>
                                                <label className="admin-product-checkbox">
                                                    <input type="checkbox" checked={selection.has(product._id)} onChange={() => toggleSelection(product._id)} />
                                                    <span className="sr-only">Select {product.name}</span>
                                                </label>
                                                {product.images?.[0]?.url ? (
                                                    <img className="admin-product-image" src={product.images[0].url} alt="" />
                                                ) : (
                                                    <span className="admin-product-image admin-product-image-empty"><i className="fa fa-leaf" aria-hidden="true"></i></span>
                                                )}
                                                <div className="admin-product-info">
                                                    <Link to={`/admin/product/${product._id}`} className="admin-product-name">{product.name}</Link>
                                                    <span className="admin-product-category">{product.category}</span>
                                                    <span className="admin-product-id" title={product._id}>ID · {product._id.slice(-8)}</span>
                                                </div>
                                                <div className="admin-product-price">
                                                    <span>Price</span><strong>{price}</strong>
                                                </div>
                                                <div className="admin-product-stock">
                                                    <span>Stock</span><strong>{product.stock}</strong>
                                                </div>
                                                <span className={status.className}>{status.label}</span>
                                                <div className="admin-product-actions">
                                                    <Link to={`/admin/product/${product._id}`} className="admin-product-action is-edit" aria-label={`Edit ${product.name}`} title="Edit">
                                                        <i className="fa fa-pencil" aria-hidden="true"></i>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="admin-product-action is-toggle"
                                                        aria-label={`${isAvailable ? 'Make unavailable' : 'Make available'}: ${product.name}`}
                                                        title={isAvailable ? 'Make unavailable' : 'Make available'}
                                                        disabled={busyProductId === product._id}
                                                        onClick={() => toggleAvailability(product)}
                                                    >
                                                        <i className={`fa ${isAvailable ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="admin-product-action is-delete"
                                                        aria-label={`Delete ${product.name}`}
                                                        title="Delete"
                                                        disabled={busyProductId === product._id}
                                                        onClick={() => deleteProduct(product._id)}
                                                    >
                                                        <i className="fa fa-trash-o" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </article>
                                        )
                                    })}
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>
        </>
    )
}

export default ProductsList
