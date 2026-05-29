import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout/Layout'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Students from './pages/Students/Students'
import Grades from './pages/Grades/Grades'
import Absences from './pages/Absences/Absences'
import Messages from './pages/Messages/Messages'
import Profile from './pages/Profile/Profile'
import NotFound from './pages/NotFound/NotFound'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Route publique de connexion */}
          <Route path="/login" element={<Login />} />
          
          {/* Routes protégées avec layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Redirection par défaut vers le dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Pages principales */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="grades" element={<Grades />} />
            <Route path="absences" element={<Absences />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Route 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App