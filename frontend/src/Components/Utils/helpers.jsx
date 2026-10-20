import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
export const getUser = () => {
    if (window !== 'undefined') {
        if (sessionStorage.getItem('user')) {
            console.log(JSON.parse(sessionStorage.getItem('user')))
            return JSON.parse(sessionStorage.getItem('user'));
        } else {
            return false;
        }
    }
};

// Keeps the logged-in user (and token) in sessionStorage for the older components that read them
export const saveSession = (user, token) => {
    if (user) sessionStorage.setItem('user', JSON.stringify(user));
    if (token) sessionStorage.setItem('token', JSON.stringify(token));
};

export const clearSession = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
};

export const authenticate = (data, next) => {
    if (window !== 'undefined') {
        // console.log('authenticate', response)
        sessionStorage.setItem('token', JSON.stringify(data.token));
        sessionStorage.setItem('user', JSON.stringify(data.user));
    }
    next();
};

export const logout = next => {
    if (window !== 'undefined') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    }
    next();
};

export const getToken = () => {
    if (window !== 'undefined') {
        if (sessionStorage.getItem('token')) {
            return JSON.parse(sessionStorage.getItem('token'));
        } else {
            return false;
        }
    }
};

export const errMsg = (message = '') => toast.error(message, {
    position: 'bottom-center'
});
export const successMsg = (message = '') => toast.success(message, {
    position: 'bottom-center'
});

// Stock / availability rules used by the shop pages.
// A product can be bought only when the admin left it available AND there is stock.
export const LOW_STOCK_THRESHOLD = 10;

export const stockInfo = (product = {}, threshold = LOW_STOCK_THRESHOLD) => {
    const stock = Number(product.stock) || 0;
    const available = product.isAvailable !== false && stock > 0;
    if (!available) return { available: false, low: false, label: 'Unavailable', className: 'redColor' };
    if (stock <= threshold) return { available: true, low: true, label: `Low stock - only ${stock} left`, className: 'text-warning' };
    return { available: true, low: false, label: 'In Stock', className: 'greenColor' };
};

// lowest price of a product that has sizes, otherwise its normal price
export const priceFrom = (product = {}) => {
    if (product.sizes && product.sizes.length > 0) {
        return Math.min(...product.sizes.map(s => s.price));
    }
    return product.price;
};

export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '-';
export const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-PH') : '-';

export const ORDER_STATUSES = ['Pending', 'Processing', 'Ready for Delivery', 'Out for Delivery', 'Delivered', 'Cancelled'];
export const statusColor = (status) => status === 'Delivered' ? 'greenColor' : status === 'Cancelled' ? 'redColor' : 'text-warning';

// Philippine peso. Whole amounts show without decimals (₱350), otherwise two decimals.
// Pass `decimals` (e.g. 2) to force a fixed number of decimals (receipts, totals).
export const formatPeso = (amount, decimals) => {
    const n = Number(amount) || 0;
    const fixed = typeof decimals === 'number' ? decimals : (Number.isInteger(n) ? 0 : 2);
    return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: fixed, maximumFractionDigits: fixed });
};
