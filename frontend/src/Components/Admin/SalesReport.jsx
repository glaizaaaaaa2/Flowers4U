import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatPeso } from '../Utils/helpers'

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d) }

// Monthly sales + sales per day for a chosen date range (cancelled orders are not counted)
const SalesReport = () => {
    const [start, setStart] = useState(daysAgo(30))
    const [end, setEnd] = useState(fmt(new Date()))
    const [monthly, setMonthly] = useState([])
    const [daily, setDaily] = useState([])
    const [allTime, setAllTime] = useState(false)

    const load = async () => {
        const params = allTime ? {} : { start, end }
        try {
            const [m, d] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API}/admin/sales-per-month`, { params }),
                axios.get(`${import.meta.env.VITE_API}/admin/sales-by-date`, { params })
            ])
            setMonthly(m.data.salesPerMonth)
            setDaily(d.data.salesByDate)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        }
    }
    useEffect(() => { load() }, [allTime])   // eslint-disable-line react-hooks/exhaustive-deps

    const total = daily.reduce((acc, r) => acc + r.total, 0)
    const orders = daily.reduce((acc, r) => acc + r.orders, 0)

    return (
        <div className="card p-3 mb-4">
            <h4>Sales report</h4>
            <div className="form-inline mb-3">
                <label className="mr-2">From</label>
                <input type="date" className="form-control mr-3" value={start} max={end} disabled={allTime} onChange={(e) => setStart(e.target.value)} />
                <label className="mr-2">To</label>
                <input type="date" className="form-control mr-3" value={end} min={start} disabled={allTime} onChange={(e) => setEnd(e.target.value)} />
                <button className="btn btn-primary mr-3" onClick={load} disabled={allTime}>Apply</button>
                <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="alltime" checked={allTime} onChange={(e) => setAllTime(e.target.checked)} />
                    <label htmlFor="alltime" className="form-check-label">All time</label>
                </div>
            </div>
            <p className="text-muted">{orders} order(s), <b>{formatPeso(total, 2)}</b> in sales for this range</p>

            <h6>Monthly sales</h6>
            {monthly.length === 0 ? <p className="text-muted">No sales in this range.</p> : (
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthly} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <Line type="monotone" dataKey="total" stroke="#3d6650" strokeWidth={2} />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                    </LineChart>
                </ResponsiveContainer>
            )}

            <h6 className="mt-4">Sales per day</h6>
            {daily.length === 0 ? <p className="text-muted">No sales in this range.</p> : (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={daily}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#e39ab2" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}

export default SalesReport
