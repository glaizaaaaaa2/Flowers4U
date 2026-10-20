import { useEffect, useState } from 'react'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import Swal from 'sweetalert2'
import { getToken } from '../Utils/helpers'
import axios from 'axios'
import { DataGrid } from '@mui/x-data-grid'
import { toast } from 'react-toastify'

const ProductReviews = () => {
    const [loading, setLoading] = useState(true)
    const [listReviews, setListReviews] = useState([])

    useEffect(() => {
        let cancelled = false
        const loadReviews = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API}/reviews`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`
                    }
                })
                if (!cancelled) setListReviews(data.reviews)
            } catch (requestError) {
                if (!cancelled) toast.error(requestError.response?.data?.message || requestError.message, { position: 'bottom-right' })
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        loadReviews()
        return () => { cancelled = true }
    }, [])

    const deleteReview = async (id, productId) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API}/reviews?id=${id}&productId=${productId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                }
            })
            setListReviews(reviews => reviews.filter(review => review._id !== id))
            toast.success('Review deleted successfully', { position: 'bottom-right' })
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || requestError.message, { position: 'bottom-right' })
        }
    }

    const deleteReviewHandler = (id, productId) => {
        Swal.fire({
            title: 'Delete Review',
            icon: 'info',
            text: 'Do you want to delete this review?',
            confirmButtonText: 'Delete',
            showCancelButton: true
        }).then(result => {
            if (result.isConfirmed) deleteReview(id, productId)
        })
    }

    const columns = [
        { field: 'productName', headerName: 'Product', flex: 1, minWidth: 150 },
        { field: 'rating', headerName: 'Rating', width: 90 },
        { field: 'comment', headerName: 'Comment', flex: 2, minWidth: 200 },
        { field: 'user', headerName: 'User', width: 150 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: params => (
                <button
                    type="button"
                    className="btn btn-danger py-1 px-2"
                    aria-label={`Delete review for ${params.row.productName}`}
                    onClick={() => deleteReviewHandler(params.id, params.row.productId)}
                >
                    <i className="fa fa-trash"></i>
                </button>
            )
        }
    ]

    const rows = listReviews.map(review => ({
        id: review._id,
        comment: review.comment,
        rating: review.rating,
        user: review.name,
        productId: review.productId,
        productName: review.productName
    }))

    return (
        <>
            <MetaData title="Product Reviews" />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <div className="col-12 col-md-10">
                    <h1 className="mt-4 mb-3">Product Reviews</h1>
                    {loading ? <Loader /> : listReviews.length > 0 ? (
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                            pageSizeOptions={[10, 25, 50]}
                            disableRowSelectionOnClick
                            showToolbar
                            autoHeight
                        />
                    ) : (
                        <p className="mt-5 text-center">No Reviews.</p>
                    )}
                </div>
            </div>
        </>
    )
}

export default ProductReviews
