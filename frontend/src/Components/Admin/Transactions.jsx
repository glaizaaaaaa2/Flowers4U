import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DataGrid } from '@mui/x-data-grid'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { formatDateTime, statusColor, formatPeso } from '../Utils/helpers'

// Every payment recorded by the shop (one per order)
const Transactions = () => {
    const [orders, setOrders] = useState([])
    const [totalAmount, setTotalAmount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API}/admin/orders`)
            .then(({ data }) => { setOrders(data.orders); setTotalAmount(data.totalAmount) })
            .catch(error => toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' }))
            .finally(() => setLoading(false))
    }, [])

    const columns = [
        { field: 'date', headerName: 'Transaction date', width: 190 },
        { field: 'ref', headerName: 'Payment ref', flex: 1, minWidth: 180 },
        { field: 'customer', headerName: 'Customer', width: 150 },
        { field: 'payment', headerName: 'Payment', width: 110, renderCell: (p) => <span className={p.value === 'Paid' ? 'greenColor' : 'redColor'}><b>{p.value}</b></span> },
        { field: 'amount', headerName: 'Amount', width: 110 },
        { field: 'status', headerName: 'Order status', width: 170, renderCell: (p) => <span className={statusColor(p.value)}><b>{p.value}</b></span> },
        { field: 'actions', headerName: 'Order', width: 90, sortable: false, filterable: false, renderCell: (p) => <Link to={`/admin/order/${p.id}`} className="btn btn-primary py-1 px-2"><i className="fa fa-eye"></i></Link> },
    ]
    const rows = orders.map(o => ({
        id: o._id,
        date: formatDateTime(o.paidAt),
        ref: o.paymentInfo ? o.paymentInfo.id : '-',
        customer: o.user ? o.user.name : '-',
        payment: o.paymentInfo && o.paymentInfo.status === 'succeeded' ? 'Paid' : 'Unpaid',
        amount: formatPeso(o.totalPrice, 2),
        status: o.orderStatus
    }))

    return (
        <>
            <MetaData title={'Transactions'} />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <h1 className="my-4">Transactions</h1>
                    <p className="text-muted">Total (cancelled orders excluded): <b>{formatPeso(totalAmount, 2)}</b></p>
                    {loading ? <Loader /> : (
                        <div style={{ width: '100%' }}>
                            <DataGrid rows={rows} columns={columns} pageSize={10} rowsPerPageOptions={[5, 10, 25]} disableSelectionOnClick getRowId={(r) => r.id} showToolbar />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Transactions
