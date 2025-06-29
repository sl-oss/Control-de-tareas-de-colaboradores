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
          console.log("Tareas recibidas:", data);
          if (Array.isArray(data.data)) {
            setTareas(data.data);
          } else if (Array.isArray(data)) {
            setTareas(data);
          } else {
            console.error("Formato inesperado de respuesta:", data);
          }
        })
        .catch(() => console.error("Error al cargar tareas"));
    };

    cargarTareas();
    const intervalo = setInterval(cargarTareas, 10000);
    return () => clearInterval(intervalo);
  }, []);

  const ajustarHora = (fechaUTC) => {
    if (!fechaUTC) return "-";
    const fecha = new Date(fechaUTC);
    fecha.setHours(fecha.getHours() - 6);
    return fecha.toLocaleTimeString("es-SV", { hour12: false });
  };

  const formatearTiempo = (minutos) => {
    if (minutos === null || minutos === undefined || isNaN(minutos)) return "-";
    const hrs = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return hrs > 0 ? `${hrs} h ${mins} min` : `${mins} min`;
  };

  const getHoraLocalElSalvador = () => {
    const fecha = new Date();
    return new Date(
      fecha.toLocaleString("en-US", { timeZone: "America/El_Salvador" })
    ).toISOString();
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

  const tareasActivas = tareas.filter((t) => t.estado !== "Finalizado");
  const tareasFinalizadas = tareas.filter((t) => t.estado === "Finalizado");

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900">
      <main className="p-6 overflow-x-auto">
        {/* Formulario y tablas divididas en activas y finalizadas */}
        {/* Código actualizado como en la respuesta previa */}
      </main>
    </div>
  );
}

export default Tareas;