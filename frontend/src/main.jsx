import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './auth/index.jsx';
import Session from './session/index.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} /> 
        <Route path="/session/:sessionToken" element={
          <ProtectedRoute>
            <Session />
          </ProtectedRoute>
        } />
        <Route path="/session" element={
          <ProtectedRoute>
            <Session />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/session" replace />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
