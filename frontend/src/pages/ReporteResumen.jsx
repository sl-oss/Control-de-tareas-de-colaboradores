import { useEffect, useState } from "react";

function ReporteResumen() {
  const [resumen, setResumen] = useState([]);

  useEffect(() => {
    fetch("https://control-de-tareas-de-colaboradores.onrender.com/reporte-resumen")
      .then((res) => res.json())
      .then(setResumen);
  }, []);

  return (
    <div className="min-h-screen p-6 bg-neutral-100 text-gray-900">
      <h2 className="text-2xl font-bold mb-6 text-cyan-700">
        Resumen por colaborador
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-300 rounded shadow text-sm">
          <thead className="bg-cyan-100 text-cyan-800 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 border text-left">Colaborador</th>
              <th className="px-3 py-2 border text-center">No iniciadas</th>
              <th className="px-3 py-2 border text-center">En proceso</th>
              <th className="px-3 py-2 border text-center">Finalizadas</th>
              <th className="px-3 py-2 border text-center">Puntuales</th>
              <th className="px-3 py-2 border text-center">⭐</th>
              <th className="px-3 py-2 border text-center">Comentario</th>
            </tr>
          </thead>
          <tbody>
            {resumen.map((r, i) => (
              <tr
                key={i}
                className="border-t border-gray-200 hover:bg-cyan-50 transition"
              >
                <td className="px-3 py-2 border">{r.colaborador}</td>
                <td className="px-3 py-2 border text-center">{r.noIniciadas}</td>
                <td className="px-3 py-2 border text-center">{r.enProceso}</td>
                <td className="px-3 py-2 border text-center">{r.finalizadas}</td>
                <td className="px-3 py-2 border text-center">{r.puntuales}</td>
                <td className="px-3 py-2 border text-center">
                  {"⭐".repeat(r.estrellas)}
                </td>
                <td className="px-3 py-2 border text-center">{r.comentario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReporteResumen;