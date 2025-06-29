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
  const [editandoId, setEditandoId] = useState(null);

  const API = "https://control-de-tareas-de-colaboradores.onrender.com";

  useEffect(() => {
    fetch(`${API}/colaboradores`)
      .then((res) => res.json())
      .then((data) => {
        setColaboradores(data);
        if (data.length) {
          setNuevaTarea((prev) => ({ ...prev, colaborador: data[0].nombre }));
        }
      })
      .catch(() => console.error("Error al cargar colaboradores"));

    const cargarTareas = () => {
      fetch(`${API}/tareas`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setTareas(data);
          else console.error("Las tareas no son un array válido");
        })
        .catch(() => console.error("Error al cargar tareas"));
    };

    cargarTareas();
    const intervalo = setInterval(cargarTareas, 10000);
    return () => clearInterval(intervalo);
  }, []);

  const getHoraLocalElSalvador = () => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 19); // yyyy-mm-ddTHH:MM:SS
  };

  const formatearTiempo = (minutos) => {
    if (minutos === null || minutos === undefined || isNaN(minutos)) return "-";
    const dias = Math.floor(minutos / 1440);
    const hrs = Math.floor((minutos % 1440) / 60);
    const mins = minutos % 60;

    let resultado = "";
    if (dias > 0) resultado += `${dias} día${dias > 1 ? "s" : ""} `;
    if (hrs > 0) resultado += `${hrs} h `;
    if (mins > 0 || resultado === "") resultado += `${mins} min`;

    return resultado.trim();
  };

  const crearTarea = async (e) => {
    e.preventDefault();

    const fechaEntregaFormateada = nuevaTarea.fechaEntrega
      ? String(nuevaTarea.fechaEntrega).slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const tareaData = {
      descripcion: nuevaTarea.descripcion,
      colaborador: nuevaTarea.colaborador,
      fechaEntrega: fechaEntregaFormateada,
    };

    if (editandoId) {
      const res = await fetch(`${API}/tareas/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tareaData),
      });

      if (res.ok) {
        setTareas((prev) =>
          prev.map((t) => (t.id === editandoId ? { ...t, ...tareaData } : t))
        );
        setEditandoId(null);
      }
    } else {
      const res = await fetch(`${API}/tareas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tareaData),
      });

      if (!res.ok) {
        alert("Error al crear tarea");
        return;
      }

      const data = await res.json();
      setTareas([
        ...tareas,
        {
          id: data.id,
          ...tareaData,
          estado: "No iniciada",
          horaInicio: null,
          horaFin: null,
          tiempo: null,
        },
      ]);
    }

    setNuevaTarea({
      descripcion: "",
      colaborador: colaboradores[0]?.nombre || "",
      fechaEntrega: "",
    });
  };

  const iniciarTarea = async (id) => {
    const ahora = getHoraLocalElSalvador();

    const res = await fetch(`${API}/tareas/${id}`, {
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
    } else {
      alert("Error al iniciar tarea");
    }
  };

  const terminarTarea = async (id) => {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea?.horaInicio) {
      alert("No se puede finalizar una tarea sin hora de inicio");
      return;
    }

    const ahora = getHoraLocalElSalvador();
    const inicio = new Date(tarea.horaInicio);
    const fin = new Date(ahora);
    const diffMin = Math.round((fin.getTime() - inicio.getTime()) / 60000);

    const res = await fetch(`${API}/tareas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado: "Finalizado",
        horaInicio: tarea.horaInicio,
        horaFin: ahora,
        tiempo: diffMin,
      }),
    });

    if (res.ok) {
      setTareas((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, estado: "Finalizado", horaFin: ahora, tiempo: diffMin }
            : t
        )
      );
    } else {
      alert("Error al finalizar la tarea");
    }
  };

  const eliminarTarea = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

    const res = await fetch(`${API}/tareas/${id}`, { method: "DELETE" });

    if (res.ok) {
      setTareas((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const editarTarea = (tarea) => {
    setNuevaTarea({
      descripcion: tarea.descripcion,
      colaborador: tarea.colaborador,
      fechaEntrega: tarea.fechaEntrega,
    });
    setEditandoId(tarea.id);
  };

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900">
      <main className="p-6 overflow-x-auto">
        <form
          onSubmit={crearTarea}
          className="mb-6 flex flex-wrap gap-2 bg-blue-600 p-4 rounded-lg text-white shadow"
        >
          <input
            type="text"
            placeholder="Descripción"
            value={nuevaTarea.descripcion}
            onChange={(e) =>
              setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })
            }
            className="px-3 py-1 rounded text-black"
            required
          />
          <select
            value={nuevaTarea.colaborador}
            onChange={(e) =>
              setNuevaTarea({ ...nuevaTarea, colaborador: e.target.value })
            }
            className="px-3 py-1 rounded text-black"
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
            className="px-3 py-1 rounded text-black"
          />
          <button
            type="submit"
            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {editandoId ? "Actualizar" : "Crear"}
          </button>
        </form>

        <table className="w-full border border-gray-300 bg-white rounded shadow text-sm">
          <thead className="bg-blue-100 text-gray-800">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Tarea</th>
              <th className="px-3 py-2">Colaborador</th>
              <th className="px-3 py-2">Iniciar</th>
              <th className="px-3 py-2">Terminar</th>
              <th className="px-3 py-2">Estado</th>
              {(rol === "admin") && (
                <>
                  <th className="px-3 py-2">Inicio</th>
                  <th className="px-3 py-2">Fin</th>
                  <th className="px-3 py-2">Tiempo</th>
                </>
              )}
              <th className="px-3 py-2">Entrega</th>
              <th className="px-3 py-2">Editar</th>
              {(rol === "admin") && (
                <th className="px-3 py-2">Eliminar</th>
              )}
            </tr>
          </thead>
          <tbody>
            {tareas.map((t, index) => (
              <tr
                key={t.id}
                className="text-center border-t border-gray-200 hover:bg-gray-100"
              >
                <td className="px-3 py-2">{index + 1}</td>
                <td className="px-3 py-2">{t.descripcion}</td>
                <td className="px-3 py-2">{t.colaborador}</td>
                <td className="px-3 py-2">
                  {t.estado === "No iniciada" && (
                    <button
                      onClick={() => iniciarTarea(t.id)}
                      className="bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-white"
                    >
                      Iniciar
                    </button>
                  )}
                </td>
                <td className="px-3 py-2">
                  {t.estado === "En proceso" && (
                    <button
                      onClick={() => terminarTarea(t.id)}
                      className="bg-yellow-500 hover:bg-yellow-600 px-2 py-1 rounded"
                    >
                      Terminar
                    </button>
                  )}
                </td>
                <td className="px-3 py-2">{t.estado}</td>
                {(rol === "admin") && (
                  <>
                    <td className="px-3 py-2">{t.horaInicio?.split("T")[1]?.slice(0, 8)}</td>
                    <td className="px-3 py-2">{t.horaFin?.split("T")[1]?.slice(0, 8)}</td>
                    <td className="px-3 py-2">{formatearTiempo(t.tiempo)}</td>
                  </>
                )}
                <td className="px-3 py-2">{t.fechaEntrega}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => editarTarea(t)}
                    className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-white"
                  >
                    ✎
                  </button>
                </td>
                {(rol === "admin") && (
                  <td className="px-3 py-2">
                    <button
                      onClick={() => eliminarTarea(t.id)}
                      className="bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-white"
                    >
                      🗑️
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