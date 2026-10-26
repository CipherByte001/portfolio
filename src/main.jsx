import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import Site from './Site.jsx'   // <-- import your Site component
import { getBaseUrl } from './Site.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={getBaseUrl().replace(/\/$/, '')}>
      <Site />   {/* <-- render Site instead of App */}
    </BrowserRouter>
  </StrictMode>,
)
