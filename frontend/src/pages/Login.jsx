import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../config"; // ← Importar la URL pública

function Login() {
  const [usuario, setUsuario] = useState("operaciones.paconsultores@gmail.com");
  const [contraseña, setContraseña] = useState("EquipoPA2025");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contraseña }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("rol", data.rol);
        navigate("/tareas");
      } else {
        setError(data.error || "Credenciales inválidas");
      }
    } catch (err) {
      setError("No se pudo conectar al servidor");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-2xl shadow-lg p-10 w-[320px] flex flex-col gap-4"
      >
        <h2 className="text-3xl font-bold text-center text-blue-700">Control de Tareas</h2>
        <p className="text-sm text-center text-gray-500 mb-2">Iniciar sesión</p>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;