import axios from 'axios'
import { toast } from 'react-toastify'
import { ADD_TO_CART, REMOVE_ITEM_CART, SAVE_SHIPPING_INFO, CLEAR_CART } from '../constants/cartConstants'

const save = (getState) => localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))

// Adds a product (or changes its quantity). Products with sizes are tracked per size.
// The product is re-read from the server so price, stock and availability are always current.
export const addItemToCart = (id, quantity, size = '') => async (dispatch, getState) => {
    try {
        const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}`)
        const product = data.product

        if (product.isAvailable === false || product.stock <= 0) {
            toast.error(`${product.name} is currently unavailable`, { position: 'bottom-right' })
            return false
        }

        let price = product.price
        const hasSizes = product.sizes && product.sizes.length > 0
        if (hasSizes) {
            const found = product.sizes.find(s => s.name === size)
            if (!found) {
                toast.error('Please choose a size first', { position: 'bottom-right' })
                return false
            }
            price = found.price
        }

        const qty = Math.min(Number(quantity), product.stock)
        if (qty < Number(quantity)) {
            toast.info(`Only ${product.stock} available`, { position: 'bottom-right' })
        }

        dispatch({
            type: ADD_TO_CART,
            payload: {
                product: product._id,
                name: product.name,
                price,
                size: hasSizes ? size : '',
                image: product.images[0] ? product.images[0].url : '',
                stock: product.stock,
                quantity: qty
            }
        })
        save(getState)
        return true
    } catch (error) {
        toast.error(error.response?.data?.message || error.message, { position: 'bottom-right' })
        return false
    }
}

export const removeItemFromCart = (id, size = '') => async (dispatch, getState) => {
    dispatch({
        type: REMOVE_ITEM_CART,
        payload: { product: id, size }
    })
    save(getState)
}

export const saveShippingInfo = (data) => async (dispatch) => {
    dispatch({
        type: SAVE_SHIPPING_INFO,
        payload: data
    })
    localStorage.setItem('shippingInfo', JSON.stringify(data))
}

export const clearCart = () => async (dispatch) => {
    dispatch({
        type: CLEAR_CART,
    })
    localStorage.removeItem('cartItems')
    localStorage.removeItem('shippingInfo')
}
