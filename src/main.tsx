import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import TitleBar from '@/components/titleBar'

import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <TitleBar />
    <App />
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
