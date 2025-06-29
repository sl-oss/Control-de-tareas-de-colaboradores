import { useEffect, useState } from "react";

export default function TareasFinalizadas() {
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    fetch("https://control-de-tareas-de-colaboradores.onrender.com/tareas/finalizadas")
      .then((res) => res.json())
      .then((data) => {
        setTareas(data);
      });
  }, []);

  const formatearHora = (iso) => {
    if (!iso) return "-";
    return iso.split("T")[1]?.slice(0, 8);
  };

  const formatearTiempo = (min) => {
    if (!min && min !== 0) return "-";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}min`;
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tareas Finalizadas</h2>
      <ul className="space-y-2">
        {tareas.map((t) => (
          <li key={t.id} className="border p-3 rounded shadow bg-white">
            <div><strong>{t.descripcion}</strong> - {t.colaborador}</div>
            <div className="text-sm text-gray-600">Estado: {t.estado}</div>
            <div className="text-sm text-gray-600">Inicio: {formatearHora(t.horaInicio)}</div>
            <div className="text-sm text-gray-600">Fin: {formatearHora(t.horaFin)}</div>
            <div className="text-sm text-gray-600">Duración: {formatearTiempo(t.tiempo)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}