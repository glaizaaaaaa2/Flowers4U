import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from 'react-redux'

import { Header } from './Components/Layout/Header'
import Footer from './Components/Layout/Footer'
import { loadUser } from './actions/userActions'

import './App.css'
import Home from './Components/Home'
import ProductDetails from './Components/Product/ProductDetails';
import Login from './Components/User/Login';
import Register from './Components/User/Register';
import ForgotPassword from './Components/User/ForgotPassword';
import NewPassword from './Components/User/NewPassword';
import Profile from './Components/User/Profile';
import UpdateProfile from './Components/User/UpdateProfile';
import UpdatePassword from './Components/User/UpdatePassword';
import Cart from './Components/Cart/Cart';
import Shipping from './Components/Cart/Shipping';
import ConfirmOrder from './Components/Cart/ConfirmOrder';
import Payment from './Components/Cart/Payment';
import OrderSuccess from './Components/Cart/OrderSuccess';
import ListOrders from './Components/Order/ListOrders';
import OrderDetails from './Components/Order/OrderDetails';
import Receipt from './Components/Order/Receipt';

import Dashboard from './Components/Admin/Dashboard';
import ProductsList from './Components/Admin/ProductsList';
import NewProduct from './Components/Admin/NewProduct';
import UpdateProduct from './Components/Admin/UpdateProduct';
import Categories from './Components/Admin/Categories';
import OrdersList from './Components/Admin/OrdersList';
import ProcessOrder from './Components/Admin/ProcessOrder';
import Transactions from './Components/Admin/Transactions';
import UsersList from './Components/Admin/UsersList';
import UpdateUser from './Components/Admin/UpdateUser';
import ProtectedRoute from './Components/Route/ProtectedRoute';
import ProductReviews from './Components/Admin/ProductReviews';

const User = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>
const Admin = ({ children }) => <ProtectedRoute isAdmin={true}>{children}</ProtectedRoute>

function App() {
  const dispatch = useDispatch()

  // restore the session (cookie) after a page refresh
  useEffect(() => {
    dispatch(loadUser())
  }, [dispatch])

  return (
    <>
      <Router>
        <Header />
        <Routes>
          {/* shop */}
          <Route path="/" element={<Home />} />
          <Route path="/search/:keyword" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />

          {/* accounts */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password/forgot" element={<ForgotPassword />} />
          <Route path="/password/reset/:token" element={<NewPassword />} />
          <Route path="/me" element={<User><Profile /></User>} />
          <Route path="/me/update" element={<User><UpdateProfile /></User>} />
          <Route path="/password/update" element={<User><UpdatePassword /></User>} />

          {/* checkout + orders */}
          <Route path="/shipping" element={<User><Shipping /></User>} />
          <Route path="/confirm" element={<User><ConfirmOrder /></User>} />
          <Route path="/payment" element={<User><Payment /></User>} />
          <Route path="/success" element={<User><OrderSuccess /></User>} />
          <Route path="/orders/me" element={<User><ListOrders /></User>} />
          <Route path="/order/:id" element={<User><OrderDetails /></User>} />
          <Route path="/receipt/:id" element={<User><Receipt /></User>} />

          {/* admin */}
          <Route path="/dashboard" element={<Admin><Dashboard /></Admin>} />
          <Route path="/admin/products" element={<Admin><ProductsList /></Admin>} />
          <Route path="/admin/product" element={<Admin><NewProduct /></Admin>} />
          <Route path="/admin/product/:id" element={<Admin><UpdateProduct /></Admin>} />
          <Route path="/admin/categories" element={<Admin><Categories /></Admin>} />
          <Route path="/admin/orders" element={<Admin><OrdersList /></Admin>} />
          <Route path="/admin/order/:id" element={<Admin><ProcessOrder /></Admin>} />
          <Route path="/admin/transactions" element={<Admin><Transactions /></Admin>} />
          <Route path="/admin/users" element={<Admin><UsersList /></Admin>} />
          <Route path="/admin/user/:id" element={<Admin><UpdateUser /></Admin>} />
          <Route path="/admin/reviews" element={<Admin><ProductReviews /></Admin>} />
        </Routes>
      </Router>
      <Footer />
      <ToastContainer />
    </>
  )
}

export default App
