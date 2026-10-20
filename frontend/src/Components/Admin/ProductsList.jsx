import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DataGrid } from '@mui/x-data-grid'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { stockInfo, formatPeso } from '../Utils/helpers'

// Products + inventory: stock status is colour coded; filter to see only low / unavailable items
const ProductsList = () => {
    const [products, setProducts] = useState([])
    const [threshold, setThreshold] = useState(10)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [selection, setSelection] = useState({ type: 'include', ids: new Set() })

    const fetchProducts = () => axios.get(`${import.meta.env.VITE_API}/admin/products`)

    const load = async () => {
        try {
            const { data } = await fetchProducts()
            setProducts(data.products)
            setThreshold(data.lowStockThreshold)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        let cancelled = false
        fetchProducts()
            .then(({ data }) => {
                if (cancelled) return
                setProducts(data.products)
                setThreshold(data.lowStockThreshold)
            })
            .catch(error => {
                if (!cancelled) toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [])

    const deleteProduct = async (id) => {
        if (!window.confirm('Delete this product?')) return
        try {
            await axios.delete(`${import.meta.env.VITE_API}/admin/product/${id}`)
            toast.success('Product deleted successfully', { position: 'bottom-right' })
            load()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }

    const bulkDeleteProducts = async () => {
        const ids = [...selection.ids].map(String)
        if (ids.length === 0) return
        if (!window.confirm(`Delete ${ids.length} selected product${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return

        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API}/admin/products/bulk-delete`, { ids })
            toast.success(`${data.deletedCount} product${data.deletedCount === 1 ? '' : 's'} deleted successfully`, { position: 'bottom-right' })
            setSelection({ type: 'include', ids: new Set() })
            await load()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }

    const toggleAvailability = async (p) => {
        try {
            await axios.put(`${import.meta.env.VITE_API}/admin/product/${p._id}`, { isAvailable: !(p.isAvailable !== false) })
            load()
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }

    const shown = products.filter(p => {
        const info = stockInfo(p, threshold)
        if (filter === 'low') return info.low
        if (filter === 'unavailable') return !info.available
        return true
    })

    const lowCount = products.filter(p => stockInfo(p, threshold).low).length
    const unavailableCount = products.filter(p => !stockInfo(p, threshold).available).length

    const columns = [
        { field: 'id', headerName: 'ID', width: 90, renderCell: (p) => <span title={p.value}>{String(p.value).slice(-6)}</span> },
        { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
        { field: 'category', headerName: 'Category', width: 140 },
        { field: 'price', headerName: 'Price', width: 110 },
        { field: 'stock', headerName: 'Stock', type: 'number', width: 90 },
        {
            field: 'status', headerName: 'Availability', width: 190,
            renderCell: (params) => {
                const info = stockInfo(params.row.raw, threshold)
                return <span className={info.className}><b>{info.available ? (info.low ? 'Low stock' : 'In stock') : (params.row.raw.stock <= 0 ? 'Out of stock' : 'Unavailable')}</b></span>
            }
        },
        {
            field: 'actions', headerName: 'Actions', width: 220, sortable: false, filterable: false,
            renderCell: (params) => (
                <>
                    <Link to={`/admin/product/${params.id}`} className="btn btn-primary py-1 px-2" title="Edit"><i className="fa fa-pencil"></i></Link>
                    <button className="btn btn-warning py-1 px-2 ml-2" title="Toggle availability" onClick={() => toggleAvailability(params.row.raw)}>
                        <i className={`fa ${params.row.raw.isAvailable !== false ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                    <button className="btn btn-danger py-1 px-2 ml-2" title="Delete" onClick={() => deleteProduct(params.id)}><i className="fa fa-trash"></i></button>
                </>
            )
        }
    ]

    const rows = shown.map(p => ({
        id: p._id, name: p.name, category: p.category, price: p.sizes && p.sizes.length ? `from ${formatPeso(Math.min(...p.sizes.map(s => s.price)))}` : formatPeso(p.price),
        stock: p.stock, status: '', raw: p
    }))

    return (
        <>
            <MetaData title={'All Products'} />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <h1 className="my-4">Products &amp; Inventory</h1>
                    <div className="mb-3">
                        <button className={`btn mr-2 ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('all')}>All ({products.length})</button>
                        <button className={`btn mr-2 ${filter === 'low' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('low')}>Low stock ({lowCount})</button>
                        <button className={`btn mr-2 ${filter === 'unavailable' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('unavailable')}>Unavailable ({unavailableCount})</button>
                        <small className="text-muted">Low stock = {threshold} or fewer left</small>
                    </div>
                    <div className="mb-3">
                        <button
                            type="button"
                            className="btn btn-danger"
                            disabled={selection.ids.size === 0}
                            onClick={bulkDeleteProducts}
                        >
                            Delete selected ({selection.ids.size})
                        </button>
                    </div>
                    {loading ? <Loader /> : (
                        <div style={{ width: '100%' }}>
                            <DataGrid
                                rows={rows}
                                columns={columns}
                                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                pageSizeOptions={[5, 10, 25]}
                                checkboxSelection
                                disableRowSelectionOnClick
                                disableRowSelectionExcludeModel
                                rowSelectionModel={selection}
                                onRowSelectionModelChange={setSelection}
                                getRowId={row => row.id}
                                showToolbar
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default ProductsList
