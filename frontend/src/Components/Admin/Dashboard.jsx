import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import SalesReport from './SalesReport'
import BestSellers from './BestSellers'
import ProductSalesChart from './ProductSalesChart'
import UserSalesChart from './UserSalesChart'
import { stockInfo, formatPeso } from '../Utils/helpers'

const Dashboard = () => {
    const [products, setProducts] = useState([])
    const [threshold, setThreshold] = useState(10)
    const [totalOrders, setTotalOrders] = useState(0)
    const [totalSales, setTotalSales] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const base = import.meta.env.VITE_API
                const [p, o, s] = await Promise.all([
                    axios.get(`${base}/admin/products`),
                    axios.get(`${base}/admin/total-orders`),
                    axios.get(`${base}/admin/total-sales`),
                ])
                setProducts(p.data.products)
                setThreshold(p.data.lowStockThreshold)
                setTotalOrders(o.data.totalOrders[0] ? o.data.totalOrders[0].count : 0)
                setTotalSales(s.data.totalSales[0] ? s.data.totalSales[0].totalSales : 0)
            } catch (error) {
                toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const lowStock = products.filter(p => stockInfo(p, threshold).low)
    const unavailable = products.filter(p => !stockInfo(p, threshold).available)

    const Card = ({ color, title, value, to }) => (
        <div className="col-xl-3 col-sm-6 mb-3">
            <div className={`card text-white bg-${color} o-hidden h-100`}>
                <div className="card-body">
                    <div className="text-center card-font-size">{title}<br /> <b>{value}</b></div>
                </div>
                {to && (
                    <Link className="card-footer text-white clearfix small z-1" to={to}>
                        <span className="float-left">View Details</span>
                        <span className="float-right"><i className="fa fa-angle-right"></i></span>
                    </Link>
                )}
            </div>
        </div>
    )

    return (
        <>
            <MetaData title={'Admin Dashboard'} />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>

                <div className="col-12 col-md-10">
                    <h1 className="my-4">Dashboard</h1>
                    {loading ? <Loader /> : (
                        <>
                            <div className="row pr-4">
                                <Card color="primary" title="Total Sales" value={formatPeso(totalSales, 2)} to="/admin/transactions" />
                                <Card color="danger" title="Orders" value={totalOrders} to="/admin/orders" />
                                <Card color="success" title="Products" value={products.length} to="/admin/products" />
                                <Card color="warning" title="Low / Unavailable" value={`${lowStock.length} / ${unavailable.length}`} to="/admin/products" />
                            </div>

                            <div className="row pr-4">
                                <div className="col-lg-6 mb-4">
                                    <div className="card p-3 h-100">
                                        <h4>Low stock <small className="text-muted">({threshold} or fewer)</small></h4>
                                        {lowStock.length === 0 ? <p className="text-muted">Nothing running low.</p> : (
                                            <ul className="list-unstyled mb-0">
                                                {lowStock.map(p => (
                                                    <li key={p._id}><Link to={`/admin/product/${p._id}`}>{p.name}</Link> - <b className="text-warning">{p.stock} left</b></li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                <div className="col-lg-6 mb-4">
                                    <div className="card p-3 h-100">
                                        <h4>Unavailable / out of stock</h4>
                                        {unavailable.length === 0 ? <p className="text-muted">Everything is available.</p> : (
                                            <ul className="list-unstyled mb-0">
                                                {unavailable.map(p => (
                                                    <li key={p._id}><Link to={`/admin/product/${p._id}`}>{p.name}</Link> - <b className="redColor">{p.stock <= 0 ? 'out of stock' : 'switched off'}</b></li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pr-4">
                                <SalesReport />
                                <BestSellers />
                                <div className="card p-3 mb-4">
                                    <h4>Share of sales per product</h4>
                                    <ProductSalesChart />
                                </div>
                                <div className="card p-3 mb-4">
                                    <h4>Sales per customer</h4>
                                    <UserSalesChart />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

export default Dashboard
