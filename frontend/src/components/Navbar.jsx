// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Navbar() {
  const [rol, setRol] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setRol(localStorage.getItem("rol"));
  }, []);

  const cerrarSesion = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!rol) return null;

  return (
    <nav className="bg-neutral-900 text-white px-6 py-4 shadow-md flex justify-between items-center">
      <div className="flex gap-6 items-center">
        <Link to="/tareas" className="hover:text-green-400 font-semibold transition">
          Tareas
        </Link>

        {rol === "admin" && (
          <>
            <Link to="/colaboradores" className="hover:text-green-400 font-semibold transition">
              Colaboradores
            </Link>

            <Link to="/seguimiento" className="hover:text-green-400 font-semibold transition">
              Seguimiento
            </Link>

            <Link to="/reporte-no-iniciadas" className="hover:text-green-400 font-semibold transition">
              No iniciadas
            </Link>

            <Link to="/resumen" className="hover:text-green-400 font-semibold transition">
              Resumen
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm italic text-gray-300">Rol: {rol}</span>
        <button
          onClick={cerrarSesion}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm shadow-sm transition"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

export default Navbar;