import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import KahootChallenge from '../pages/ChallengePage';
import AdminPage from '../components/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KahootChallenge />} />
        
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}