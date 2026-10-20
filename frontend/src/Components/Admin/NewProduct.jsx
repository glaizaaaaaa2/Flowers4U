import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'
import ProductForm from './ProductForm'

const NewProduct = () => {
    const navigate = useNavigate()
    const [submitting, setSubmitting] = useState(false)

    const save = async (payload) => {
        setSubmitting(true)
        try {
            await axios.post(`${import.meta.env.VITE_API}/admin/product/new`, payload)
            toast.success('Product created successfully', { position: 'bottom-right' })
            navigate('/admin/products')
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
            setSubmitting(false)
        }
    }

    return (
        <>
            <MetaData title={'New Product'} />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <ProductForm title="New Product" onSubmit={save} submitting={submitting} requireImages />
                </div>
            </div>
        </>
    )
}

export default NewProduct
