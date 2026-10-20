import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import useCategories from '../../hooks/useCategories'

// Shared by "New Product" and "Update Product".
// onSubmit receives a plain object; images are base64 strings (uploaded to Cloudinary by the server).
const ProductForm = ({ title, initial, onSubmit, submitting, requireImages }) => {
    const { categories } = useCategories()
    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: '',
            price: 0,
            description: '',
            category: '',
            stock: 0,
            seller: 'Flowers 4U',
            isAvailable: true,
            sizes: []
        }
    })
    const { fields: sizes, append, remove } = useFieldArray({ control, name: 'sizes' })
    const category = useWatch({ control, name: 'category' })
    const price = useWatch({ control, name: 'price' })
    const currentSizes = useWatch({ control, name: 'sizes' }) || []
    const [images, setImages] = useState([])
    const [imagesPreview, setImagesPreview] = useState([])
    const [replaceImages, setReplaceImages] = useState(false)
    const oldImages = replaceImages ? [] : (initial?.images || [])

    // fill the form when editing
    useEffect(() => {
        if (!initial) return
        reset({
            name: initial.name || '',
            price: initial.price ?? 0,
            description: initial.description || '',
            category: initial.category || '',
            stock: initial.stock ?? 0,
            seller: initial.seller || 'Flowers 4U',
            isAvailable: initial.isAvailable !== false,
            sizes: (initial.sizes || []).map(s => ({ name: s.name, price: s.price }))
        })
    }, [initial, reset])

    // default to the first category when creating
    useEffect(() => {
        if (!initial && !category && categories.length > 0) {
            setValue('category', categories[0].name)
        }
    }, [categories, category, initial, setValue])

    const hasSizes = sizes.length > 0
    const lowestSize = hasSizes
        ? Math.min(...currentSizes.map(s => Number(s.price) || 0))
        : null

    const onImages = (e) => {
        const files = Array.from(e.target.files)
        setImages([])
        setImagesPreview([])
        setReplaceImages(true)
        files.forEach(file => {
            const reader = new FileReader()
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagesPreview(old => [...old, reader.result])
                    setImages(old => [...old, reader.result])
                }
            }
            reader.readAsDataURL(file)
        })
    }

    const submit = (values) => {
        if (!category) return toast.error('Please create a category first', { position: 'bottom-right' })
        if (requireImages && images.length === 0) return toast.error('Please upload at least one image', { position: 'bottom-right' })
        onSubmit({
            ...values,
            name: values.name.trim(),
            description: values.description.trim(),
            category: values.category,
            seller: values.seller.trim(),
            stock: Number(values.stock),
            price: hasSizes ? lowestSize : Number(values.price),
            sizes: values.sizes.map(s => ({ name: s.name.trim(), price: Number(s.price) })),
            images
        })
    }

    return (
        <div className="wrapper my-5">
            <form className="shadow-lg" onSubmit={handleSubmit(submit)}>
                <h1 className="mb-4">{title}</h1>

                <div className="form-group">
                    <label htmlFor="name_field">Name</label>
                    <input
                        type="text"
                        id="name_field"
                        className="form-control"
                        {...register('name', { required: 'Please enter a product name', validate: value => Boolean(value.trim()) || 'Product name cannot be blank' })}
                    />
                    {errors.name && <small className="text-danger">{errors.name.message}</small>}
                </div>

                <div className="form-group">
                    <label htmlFor="price_field">Price {hasSizes && <small className="text-muted">(set by the lowest size price)</small>}</label>
                    <input
                        type="number" min="0" step="0.01" id="price_field" className="form-control"
                        value={hasSizes ? lowestSize : price}
                        disabled={hasSizes}
                        {...register('price', { valueAsNumber: true, required: 'Please enter a price', min: { value: 0, message: 'Price cannot be negative' } })}
                    />
                    {errors.price && <small className="text-danger">{errors.price.message}</small>}
                </div>

                <div className="form-group">
                    <label>Sizes (optional)</label>
                    {sizes.map((size, i) => (
                        <div className="d-flex mb-2" key={size.id}>
                            <input className="form-control mr-2" placeholder="e.g. Small" {...register(`sizes.${i}.name`, { required: 'Enter a size name', validate: value => Boolean(value.trim()) || 'Enter a size name' })} />
                            <input className="form-control mr-2" type="number" min="0" step="0.01" placeholder="Price" {...register(`sizes.${i}.price`, { valueAsNumber: true, required: 'Enter a size price', min: { value: 0, message: 'Price cannot be negative' } })} />
                            <button type="button" className="btn btn-danger" onClick={() => remove(i)}><i className="fa fa-trash"></i></button>
                            {(errors.sizes?.[i]?.name || errors.sizes?.[i]?.price) && (
                                <small className="text-danger">
                                    {errors.sizes[i].name?.message || errors.sizes[i].price?.message}
                                </small>
                            )}
                        </div>
                    ))}
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => append({ name: '', price: '' })}>
                        + Add size
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="description_field">Description</label>
                    <textarea
                        className="form-control"
                        id="description_field"
                        rows="6"
                        {...register('description', { required: 'Please enter a product description', validate: value => Boolean(value.trim()) || 'Description cannot be blank' })}
                    ></textarea>
                    {errors.description && <small className="text-danger">{errors.description.message}</small>}
                </div>

                <div className="form-group">
                    <label htmlFor="category_field">Category</label>
                    <select className="form-control" id="category_field" {...register('category', { required: 'Please select a category' })}>
                        {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                    {errors.category && <small className="text-danger">{errors.category.message}</small>}
                </div>

                <div className="form-group">
                    <label htmlFor="stock_field">Stock</label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        id="stock_field"
                        className="form-control"
                        {...register('stock', { valueAsNumber: true, required: 'Please enter stock', min: { value: 0, message: 'Stock cannot be negative' }, validate: value => Number.isInteger(value) || 'Stock must be a whole number' })}
                    />
                    {errors.stock && <small className="text-danger">{errors.stock.message}</small>}
                </div>

                <div className="form-group form-check">
                    <input type="checkbox" className="form-check-input" id="available_field" {...register('isAvailable')} />
                    <label className="form-check-label" htmlFor="available_field">
                        Available for purchase <small className="text-muted">(untick to hide it from buying even if in stock)</small>
                    </label>
                </div>

                <div className="form-group">
                    <label htmlFor="seller_field">Seller Name</label>
                    <input
                        type="text"
                        id="seller_field"
                        className="form-control"
                        {...register('seller', { required: 'Please enter a seller name', validate: value => Boolean(value.trim()) || 'Seller name cannot be blank' })}
                    />
                    {errors.seller && <small className="text-danger">{errors.seller.message}</small>}
                </div>

                <div className="form-group">
                    <label>Images (you can pick several)</label>
                    <div className="custom-file">
                        <input type="file" name="product_images" className="custom-file-input" id="customFile" accept="image/*" multiple onChange={onImages} />
                        <label className="custom-file-label" htmlFor="customFile">Choose Images</label>
                    </div>
                    {oldImages.map(img => <img src={img.url} key={img.public_id} alt="current" className="mt-3 mr-2" width="55" height="52" />)}
                    {imagesPreview.map(img => <img src={img} key={img.slice(-30)} alt="preview" className="mt-3 mr-2" width="55" height="52" />)}
                    {!requireImages && <small className="d-block text-muted mt-1">Leave empty to keep the current images.</small>}
                </div>

                <button id="login_button" type="submit" className="btn btn-block py-3" disabled={submitting}>
                    {submitting ? 'Saving...' : 'SAVE'}
                </button>
            </form>
        </div>
    )
}

export default ProductForm
