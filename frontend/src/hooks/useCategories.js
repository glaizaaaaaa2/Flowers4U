import { useEffect, useState } from 'react'
import axios from 'axios'

// Loads the shop's categories from the database (admin manages them)
export default function useCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    const reload = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/categories`)
            setCategories(data.categories)
        } catch (e) {
            setCategories([])
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { reload() }, [])

    return { categories, loading, reload }
}
