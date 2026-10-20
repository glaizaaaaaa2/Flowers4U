import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Top 5 products by units sold
const BestSellers = () => {
    const [rows, setRows] = useState([])
    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API}/admin/best-sellers`, { params: { limit: 5 } })
            .then(({ data }) => setRows(data.bestSellers))
            .catch(() => setRows([]))
    }, [])

    return (
        <div className="card p-3 mb-4">
            <h4>Best-selling arrangements</h4>
            {rows.length === 0 ? <p className="text-muted">No sales yet.</p> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={rows} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="2 2" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={150} />
                        <Tooltip />
                        <Bar dataKey="unitsSold" name="Units sold" fill="#3d6650" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}

export default BestSellers
