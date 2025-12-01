import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { FlatEarthPage } from './pages/FlatEarthPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/uearth">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/flat-earth" element={<FlatEarthPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
