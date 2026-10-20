import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import ProductForm from './ProductForm'

const UpdateProduct = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API}/product/${id}`)
            .then(({ data }) => setProduct(data.product))
            .catch(e => toast.error(e.response?.data?.message || e.message, { position: 'bottom-right' }))
    }, [id])

    const save = async (payload) => {
        setSubmitting(true)
        try {
            await axios.put(`${import.meta.env.VITE_API}/admin/product/${id}`, payload)
            toast.success('Product updated successfully', { position: 'bottom-right' })
            navigate('/admin/products')
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
            setSubmitting(false)
        }
    }

    return (
        <>
            <MetaData title={'Update Product'} />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    {product ? <ProductForm title="Update Product" initial={product} onSubmit={save} submitting={submitting} /> : <Loader />}
                </div>
            </div>
        </>
    )
}

export default UpdateProduct
