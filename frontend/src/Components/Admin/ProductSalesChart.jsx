import React, { useState, useEffect } from 'react'
import { getToken } from "../Utils/helpers";
import axios from "axios";
import Loader from '../Layout/Loader';

import { PieChart, Pie, Legend, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ProductSalesChart() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const pieColors = [
        "#3d6650", "#e39ab2", "#a9c3b0", "#a8486a", "#5f8d71", "#f1b9c9",
        "#2b4a39", "#c97a95", "#86ae93", "#f8dde5", "#7ba68a", "#d9a441",
    ]
    // console.log(data)

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${percent}%`}
            </text>
        );
    };
    const productSales = async () => {
        try {
            const config = {
                headers: {

                    'Authorization': `Bearer ${getToken()}`
                }
            }

            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/product-sales`, config)
            setSales(data.totalPercentage)

        } catch (error) {
            setError((error.response?.data?.message || error.message))

        }
    }
    useEffect(() => {
        productSales()
    }, [])


    return (
        <ResponsiveContainer width="100%" height={420}>
            <PieChart>
                {/* <Pie data={data} dataKey="percent" nameKey="name" cx="50%" cy="50%" outerRadius={50} fill="#3d6650" /> */}
                <Pie
                    dataKey="percent"
                    nameKey="name"
                    isAnimationActive={true}
                    data={sales}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#3d6650"
                    label={renderCustomizedLabel}
                    labelLine={false}
                // label
                >  {
                        sales.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)
                    }
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="top" align="right" />
            </PieChart>
        </ResponsiveContainer>


    );
}