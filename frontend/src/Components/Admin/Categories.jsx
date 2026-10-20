import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import useCategories from '../../hooks/useCategories'

const Categories = () => {
    const { categories, loading, reload } = useCategories()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [editing, setEditing] = useState(null)   // { _id, name, description }

    const fail = (error) => toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })

    const add = async (e) => {
        e.preventDefault()
        try {
            await axios.post(`${import.meta.env.VITE_API}/admin/category/new`, { name, description })
            toast.success('Category added', { position: 'bottom-right' })
            setName(''); setDescription('')
            reload()
        } catch (error) { fail(error) }
    }

    const saveEdit = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_API}/admin/category/${editing._id}`, { name: editing.name, description: editing.description })
            toast.success('Category updated', { position: 'bottom-right' })
            setEditing(null)
            reload()
        } catch (error) { fail(error) }
    }

    const remove = async (c) => {
        if (!window.confirm(`Delete "${c.name}"?`)) return
        try {
            await axios.delete(`${import.meta.env.VITE_API}/admin/category/${c._id}`)
            toast.success('Category deleted', { position: 'bottom-right' })
            reload()
        } catch (error) { fail(error) }
    }

    return (
        <>
            <MetaData title={'Categories'} />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <h1 className="my-4">Categories</h1>

                    <form className="form-inline mb-4" onSubmit={add}>
                        <input className="form-control mr-2 mb-2" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
                        <input className="form-control mr-2 mb-2" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                        <button className="btn btn-primary mb-2" type="submit">Add category</button>
                    </form>

                    {loading ? <Loader /> : (
                        <table className="table table-striped">
                            <thead><tr><th>Name</th><th>Description</th><th style={{ width: 160 }}>Actions</th></tr></thead>
                            <tbody>
                                {categories.map(c => (
                                    <tr key={c._id}>
                                        {editing && editing._id === c._id ? (
                                            <>
                                                <td><input className="form-control" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></td>
                                                <td><input className="form-control" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></td>
                                                <td>
                                                    <button className="btn btn-success py-1 px-2 mr-2" onClick={saveEdit}><i className="fa fa-check"></i></button>
                                                    <button className="btn btn-secondary py-1 px-2" onClick={() => setEditing(null)}><i className="fa fa-times"></i></button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{c.name}</td>
                                                <td>{c.description}</td>
                                                <td>
                                                    <button className="btn btn-primary py-1 px-2 mr-2" onClick={() => setEditing(c)}><i className="fa fa-pencil"></i></button>
                                                    <button className="btn btn-danger py-1 px-2" onClick={() => remove(c)}><i className="fa fa-trash"></i></button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {categories.length === 0 && <tr><td colSpan="3">No categories yet - add one above.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    )
}

export default Categories
