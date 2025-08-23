import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Site from './Site.jsx'   // <-- import your Site component

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Site />   {/* <-- render Site instead of App */}
  </StrictMode>,
)
