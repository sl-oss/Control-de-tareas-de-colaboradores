import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Tareas() {
  const navigate = useNavigate();
  const rol = localStorage.getItem("rol");

  const [tareas, setTareas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  const [nuevaTarea, setNuevaTarea] = useState({
    descripcion: "",
    colaborador: "",
    fechaEntrega: "",
  });

  useEffect(() => {
    fetch("http://localhost:3001/colaboradores")
      .then((res) => res.json())
      .then((data) => {
        setColaboradores(data);
        if (data.length) {
          setNuevaTarea((prev) => ({ ...prev, colaborador: data[0].nombre }));
        }
      })
      .catch(() => console.error("Error al cargar colaboradores"));

    const cargarTareas = () => {
      fetch("http://localhost:3001/tareas")
        .then((res) => res.json())
        .then((data) => setTareas(data))
        .catch(() => console.error("Error al cargar tareas"));
    };

    cargarTareas();
    const intervalo = setInterval(cargarTareas, 10000);
    return () => clearInterval(intervalo);
  }, []);

  const cerrarSesion = () => {
    localStorage.clear();
    navigate("/");
  };

  const crearTarea = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3001/tareas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaTarea),
    });

    const data = await res.json();
    if (res.ok) {
      setTareas([
        ...tareas,
        {
          id: data.id,
          descripcion: nuevaTarea.descripcion,
          colaborador: nuevaTarea.colaborador,
          fechaEntrega: nuevaTarea.fechaEntrega,
          estado: "No iniciada",
          horaInicio: null,
          horaFin: null,
          tiempo: null,
        },
      ]);
      setNuevaTarea({
        descripcion: "",
        colaborador: colaboradores[0]?.nombre || "",
        fechaEntrega: "",
      });
    } else {
      alert("Error al crear tarea");
    }
  };

  const iniciarTarea = async (id) => {
    const ahora = new Date().toISOString();
    const res = await fetch(`http://localhost:3001/tareas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado: "En proceso",
        horaInicio: ahora,
        horaFin: null,
        tiempo: null,
      }),
    });

    if (res.ok) {
      setTareas((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, estado: "En proceso", horaInicio: ahora } : t
        )
      );
    }
  };

  const terminarTarea = async (id) => {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea?.horaInicio) return;

    const ahora = new Date();
    const inicio = new Date(tarea.horaInicio);
    const diffMin = Math.round((ahora - inicio) / 60000);

    const res = await fetch(`http://localhost:3001/tareas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado: "Finalizado",
        horaInicio: tarea.horaInicio,
        horaFin: ahora.toISOString(),
        tiempo: `${diffMin} min`,
      }),
    });

    if (res.ok) {
      setTareas((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                estado: "Finalizado",
                horaFin: ahora.toISOString(),
                tiempo: `${diffMin} min`,
              }
            : t
        )
      );
    }
  };

  const eliminarTarea = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

    const res = await fetch(`http://localhost:3001/tareas/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setTareas((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900">
      <main className="p-6 overflow-x-auto">
        {rol === "admin" && (
          <form
            onSubmit={crearTarea}
            className="bg-gray-800 p-4 mb-6 rounded shadow flex flex-wrap gap-4 items-center border border-gray-700"
          >
            <input
              type="text"
              placeholder="Descripción"
              value={nuevaTarea.descripcion}
              onChange={(e) =>
                setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })
              }
              required
              className="p-2 bg-gray-900 text-white border border-gray-600 rounded w-64"
            />

            <select
              value={nuevaTarea.colaborador}
              onChange={(e) =>
                setNuevaTarea({ ...nuevaTarea, colaborador: e.target.value })
              }
              className="p-2 bg-gray-900 text-white border border-gray-600 rounded"
            >
              {colaboradores.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={nuevaTarea.fechaEntrega}
              onChange={(e) =>
                setNuevaTarea({ ...nuevaTarea, fechaEntrega: e.target.value })
              }
              required
              className="p-2 bg-gray-900 text-white border border-gray-600 rounded"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Crear tarea
            </button>
          </form>
        )}

        <table className="w-full border border-gray-700 bg-gray-800 rounded shadow text-sm">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Tarea</th>
              <th className="px-3 py-2">Colaborador</th>
              <th className="px-3 py-2">Iniciar</th>
              <th className="px-3 py-2">Terminar</th>
              <th className="px-3 py-2">Estado</th>
              {rol === "admin" && <th className="px-3 py-2">Inicio</th>}
              {rol === "admin" && <th className="px-3 py-2">Fin</th>}
              {rol === "admin" && <th className="px-3 py-2">Tiempo</th>}
              <th className="px-3 py-2">Entrega</th>
              {rol === "admin" && <th className="px-3 py-2">Eliminar</th>}
            </tr>
          </thead>
          <tbody>
            {tareas.map((t) => (
              <tr
                key={t.id}
                className="text-center border-t border-gray-700 hover:bg-gray-700 text-white"
              >
                <td className="px-3 py-2">{t.id}</td>
                <td className="px-3 py-2">{t.descripcion}</td>
                <td className="px-3 py-2">{t.colaborador}</td>

                <td className="px-3 py-2">
                  <button
                    onClick={() => iniciarTarea(t.id)}
                    disabled={t.estado !== "No iniciada"}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded disabled:opacity-50"
                  >
                    Iniciar
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => terminarTarea(t.id)}
                    disabled={t.estado !== "En proceso"}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded disabled:opacity-50"
                  >
                    Terminar
                  </button>
                </td>

                <td className="px-3 py-2">{t.estado}</td>
                {rol === "admin" && (
                  <td className="px-3 py-2 text-xs">
                    {t.horaInicio?.slice(11, 19)}
                  </td>
                )}
                {rol === "admin" && (
                  <td className="px-3 py-2 text-xs">
                    {t.horaFin?.slice(11, 19)}
                  </td>
                )}
                {rol === "admin" && <td className="px-3 py-2">{t.tiempo}</td>}
                <td className="px-3 py-2">{t.fechaEntrega}</td>

                {rol === "admin" && (
                  <td className="px-3 py-2">
                    <button
                      onClick={() => eliminarTarea(t.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      🗑
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default Tareas;