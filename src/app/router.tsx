import { createBrowserRouter, Navigate } from 'react-router'
import App from './App'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/e/:evid', element: <App /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
