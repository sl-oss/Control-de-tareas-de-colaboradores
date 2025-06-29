import { useEffect, useState } from "react";

export default function TareasFinalizadas() {
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    fetch("/tareas/finalizadas")
      .then((res) => res.json())
      .then(setTareas);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tareas Finalizadas</h2>
      <ul className="space-y-2">
        {tareas.map((t) => (
          <li key={t.id} className="border p-2 rounded shadow">
            <strong>{t.descripcion}</strong> - {t.colaborador} <br />
            <span className="text-sm text-gray-600">Estado: {t.estado}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}