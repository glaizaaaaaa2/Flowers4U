import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store'
import { getToken } from './Components/Utils/helpers'

// Send the login cookie with every API request (frontend and backend run on different ports)
axios.defaults.withCredentials = true

axios.interceptors.request.use(config => {
  const apiBase = import.meta.env.VITE_API
  const token = getToken()

  if (apiBase && config.url && token && (config.url === apiBase || config.url.startsWith(`${apiBase}/`))) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
