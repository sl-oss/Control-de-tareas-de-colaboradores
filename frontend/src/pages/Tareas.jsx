// src/pages/Tareas.jsx
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
        .then((data) => setTareas(data))
        .catch(() => console.error("Error al cargar tareas"));
    };

    cargarTareas();
    const intervalo = setInterval(cargarTareas, 10000);
    return () => clearInterval(intervalo);
  }, []);

  const getHoraLocalElSalvador = () => {
    const fecha = new Date();
    return new Date(
      fecha.toLocaleString("en-US", { timeZone: "America/El_Salvador" })
    ).toISOString();
  };

  const formatearTiempo = (minutos) => {
    if (minutos === null || minutos === undefined || isNaN(minutos)) return "-";
    const hrs = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (hrs > 0) return `${hrs} h ${mins} min`;
    return `${mins} min`;
  };

  const crearTarea = async (e) => {
    e.preventDefault();

    const tareaData = {
      descripcion: nuevaTarea.descripcion,
      colaborador: nuevaTarea.colaborador,
      fechaEntrega: nuevaTarea.fechaEntrega,
      estado: "No iniciada",
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

      const data = await res.json();
      if (res.ok) {
        setTareas([
          ...tareas,
          {
            id: data.id,
            ...tareaData,
            horaInicio: null,
            horaFin: null,
            tiempo: null,
          },
        ]);
      } else {
        alert("Error al crear tarea");
      }
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
    const diffMin = Math.round((fin - inicio) / 60000);

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
            ? {
                ...t,
                estado: "Finalizado",
                horaFin: ahora,
                tiempo: diffMin,
              }
            : t
        )
      );
    } else {
      alert("Error al finalizar la tarea");
    }
  };

  const eliminarTarea = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

    const res = await fetch(`${API}/tareas/${id}`, {
      method: "DELETE",
    });

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
        {/* ...formulario y tabla... */}
        <table className="w-full border border-gray-700 bg-gray-800 rounded shadow text-sm">
          {/* ...thead... */}
          <tbody>
            {tareas.map((t) => (
              <tr
                key={t.id}
                className="text-center border-t border-gray-700 hover:bg-gray-700 text-white"
              >
                {/* ...otras columnas... */}
                {rol === "admin" && (
                  <td className="px-3 py-2">{formatearTiempo(t.tiempo)}</td>
                )}
                {/* ...otras columnas... */}
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default Tareas;