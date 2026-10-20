import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store'

// Send the login cookie with every API request (frontend and backend run on different ports)
axios.defaults.withCredentials = true

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
