// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Tareas from "./pages/Tareas";
import Colaboradores from "./pages/Colaboradores";
import ReporteSeguimiento from "./pages/ReporteSeguimiento";
import ReporteNoIniciadas from "./pages/ReporteNoIniciadas";
import ReporteResumen from "./pages/ReporteResumen"; // ➕ NUEVO
import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./components/Navbar";

function AppContent() {
  const location = useLocation();
  const [rol, setRol] = useState(null);

  useEffect(() => {
    setRol(localStorage.getItem("rol"));
  }, [location]);

  return (
    <>
      {rol && location.pathname !== "/" && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/tareas"
          element={
            <ProtectedRoute>
              <Tareas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/colaboradores"
          element={
            <ProtectedRoute>
              <Colaboradores />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seguimiento"
          element={
            <ProtectedRoute>
              <ReporteSeguimiento />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reporte-no-iniciadas"
          element={
            <ProtectedRoute>
              <ReporteNoIniciadas />
            </ProtectedRoute>
          }
        />

        {/* ➕ Nueva ruta para el reporte de resumen */}
        <Route
          path="/resumen"
          element={
            <ProtectedRoute>
              <ReporteResumen />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}