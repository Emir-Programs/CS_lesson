import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ChallengePage from '../pages/ChallengePage.jsx'

function App() {
  return (
    <>
      <BrowserRouter>
          <Routes>
              <Route path="/" element={<ChallengePage />} />
          </Routes>
      </BrowserRouter>
    </>
  )
}

export default App