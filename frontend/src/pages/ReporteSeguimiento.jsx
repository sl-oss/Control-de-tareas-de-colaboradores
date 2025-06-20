import { useEffect, useState } from "react";

function ReporteSeguimiento() {
  const [colaboradores, setColaboradores] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [seleccionado, setSeleccionado] = useState("");

  useEffect(() => {
    fetch("https://control-de-tareas-de-colaboradores.onrender.com/colaboradores")
      .then((res) => res.json())
      .then(setColaboradores);
  }, []);

  useEffect(() => {
    if (!seleccionado) return;
    fetch("https://control-de-tareas-de-colaboradores.onrender.com/tareas")
      .then((res) => res.json())
      .then((data) => {
        const filtradas = data.filter(
          (t) => t.colaborador === seleccionado && t.horaInicio
        );
        setTareas(filtradas);
      });
  }, [seleccionado]);

  const evaluarEntrega = (tarea) => {
    if (!tarea.horaFin) return "En progreso";
    const entrega = new Date(tarea.fechaEntrega);
    const fin = new Date(tarea.horaFin);
    return fin <= entrega.setHours(23, 59, 59, 999) ? "Puntual" : "Atrasado";
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 text-gray-900">
      <h2 className="text-2xl font-bold mb-6 text-green-700">
        Seguimiento por colaborador
      </h2>

      <select
        value={seleccionado}
        onChange={(e) => setSeleccionado(e.target.value)}
        className="mb-6 p-2 bg-white text-gray-800 border border-gray-400 rounded"
      >
        <option value="">Seleccione colaborador</option>
        {colaboradores.map((c) => (
          <option key={c.id} value={c.nombre}>
            {c.nombre}
          </option>
        ))}
      </select>

      {tareas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full bg-white text-gray-800 border border-gray-300 rounded shadow text-sm">
            <thead className="bg-green-100 text-green-800 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Tarea</th>
                <th className="px-3 py-2 text-left">Entrega</th>
                <th className="px-3 py-2 text-left">Inicio</th>
                <th className="px-3 py-2 text-left">Fin</th>
                <th className="px-3 py-2 text-left">Tiempo</th>
                <th className="px-3 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {tareas.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-gray-300 hover:bg-green-50"
                >
                  <td className="px-3 py-2">{t.id}</td>
                  <td className="px-3 py-2">{t.descripcion}</td>
                  <td className="px-3 py-2">{t.fechaEntrega}</td>
                  <td className="px-3 py-2 text-xs">
                    {t.horaInicio?.slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {t.horaFin ? t.horaFin.slice(0, 19).replace("T", " ") : "-"}
                  </td>
                  <td className="px-3 py-2">{t.tiempo || "-"}</td>
                  <td className="px-3 py-2">
                    {evaluarEntrega(t) === "Puntual"
                      ? "✅ Puntual"
                      : evaluarEntrega(t) === "Atrasado"
                      ? "❌ Atrasado"
                      : "🕐 En progreso"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReporteSeguimiento;