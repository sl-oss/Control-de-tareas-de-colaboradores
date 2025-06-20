import { useEffect, useState } from "react";

function ReporteNoIniciadas() {
  const [colaboradores, setColaboradores] = useState([]);
  const [seleccionado, setSeleccionado] = useState("");
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    fetch("https://control-de-tareas-de-colaboradores.onrender.com/colaboradores")
      .then((res) => res.json())
      .then((data) => {
        setColaboradores(data);
        if (data.length > 0) setSeleccionado(data[0].nombre);
      });
  }, []);

  useEffect(() => {
    if (seleccionado) {
      fetch(`https://control-de-tareas-de-colaboradores.onrender.com/reporte-no-iniciadas?colaborador=${encodeURIComponent(seleccionado)}`)
        .then((res) => res.json())
        .then(setTareas);
    }
  }, [seleccionado]);

  return (
    <div className="min-h-screen p-6 bg-neutral-100 text-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-emerald-700">
        Tareas No Iniciadas
      </h2>

      <div className="mb-6">
        <label className="mr-2 font-medium">Colaborador:</label>
        <select
          value={seleccionado}
          onChange={(e) => setSeleccionado(e.target.value)}
          className="p-2 border border-gray-400 rounded bg-white text-gray-800 shadow"
        >
          {colaboradores.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white text-gray-800 border border-gray-300 rounded shadow text-sm">
          <thead className="bg-emerald-100 text-emerald-900 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left border">ID</th>
              <th className="px-3 py-2 text-left border">Descripción</th>
              <th className="px-3 py-2 text-left border">Entrega</th>
            </tr>
          </thead>
          <tbody>
            {tareas.map((t) => (
              <tr
                key={t.id}
                className="border-t border-gray-200 hover:bg-emerald-50 transition"
              >
                <td className="px-3 py-2 border">{t.id}</td>
                <td className="px-3 py-2 border">{t.descripcion}</td>
                <td className="px-3 py-2 border">{t.fechaEntrega}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReporteNoIniciadas;