import { ADD_TO_CART, REMOVE_ITEM_CART, SAVE_SHIPPING_INFO, CLEAR_CART } from '../constants/cartConstants'

// a cart line is identified by product + size (a Large and a Small of the same bouquet are different lines)
const same = (a, b) => a.product === b.product && (a.size || '') === (b.size || '')

export const cartReducer = (state = { cartItems: [], shippingInfo: {} }, action) => {
    switch (action.type) {
        case ADD_TO_CART: {
            const item = action.payload
            const exists = state.cartItems.find(i => same(i, item))
            return {
                ...state,
                cartItems: exists
                    ? state.cartItems.map(i => same(i, item) ? item : i)
                    : [...state.cartItems, item]
            }
        }
        case REMOVE_ITEM_CART:
            return {
                ...state,
                cartItems: state.cartItems.filter(i => !same(i, action.payload))
            }
        case SAVE_SHIPPING_INFO:
            return {
                ...state,
                shippingInfo: action.payload
            }
        case CLEAR_CART:
            return {
                ...state,
                cartItems: [],
                shippingInfo: {}
            }
        default:
            return state
    }
}
