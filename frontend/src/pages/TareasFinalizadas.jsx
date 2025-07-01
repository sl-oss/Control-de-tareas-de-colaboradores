import { useEffect, useState } from "react";
import saveAs from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  TextRun
} from "docx";

export default function TareasFinalizadas() {
  const [tareas, setTareas] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [fechaAplicada, setFechaAplicada] = useState("");

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

  const formatearFechaHora = (iso) => {
    if (!iso) return "-";
    const fecha = new Date(iso);
    return fecha.toLocaleString("es-SV", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatearTiempo = (min) => {
    if (!min && min !== 0) return "-";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}min`;
  };

  const filtrarPorFecha = (tarea) => {
    if (!fechaAplicada) return true;
    if (!tarea.horaFin) return false;

    const fechaTarea = new Date(tarea.horaFin).toISOString().split("T")[0];
    return fechaTarea === fechaAplicada;
  };

  const generarWord = async () => {
    try {
      const contenido = [
        new Paragraph({
          children: [
            new TextRun({
              text: "📋 Reporte de Tareas Finalizadas",
              bold: true,
              size: 32,
              break: 1
            }),
          ],
          spacing: { after: 300 }
        }),
        ...tareas.filter(filtrarPorFecha).map(t =>
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: `Tarea: ${t.descripcion}`, bold: true, break: 1 }),
              new TextRun({ text: `Colaborador: ${t.colaborador}`, break: 1 }),
              new TextRun({ text: `Estado: ${t.estado}`, break: 1 }),
              new TextRun({ text: `Inicio: ${formatearHora(t.horaInicio)}`, break: 1 }),
              new TextRun({ text: `Finalizado el: ${formatearFechaHora(t.horaFin)}`, break: 1 }),
              new TextRun({ text: `Duración: ${formatearTiempo(t.tiempo)}`, break: 1 }),
            ]
          })
        )
      ];

      const doc = new Document({
        sections: [{ properties: {}, children: contenido }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "reporte_tareas_finalizadas.docx");
    } catch (error) {
      console.error("Error generando el documento:", error);
      alert("Ocurrió un error al generar el reporte.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tareas Finalizadas</h2>

      {/* Filtro por fecha exacta */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="date"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={() => setFechaAplicada(fechaSeleccionada)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded shadow"
        >
          Filtrar
        </button>
        <button
          onClick={() => {
            setFechaSeleccionada("");
            setFechaAplicada("");
          }}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-1 rounded shadow"
        >
          Quitar filtro
        </button>
      </div>

      <button
        onClick={generarWord}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
      >
        Descargar Word
      </button>

      <ul className="space-y-2">
        {tareas.filter(filtrarPorFecha).map((t) => (
          <li key={t.id} className="border p-3 rounded shadow bg-white">
            <div><strong>{t.descripcion}</strong> - {t.colaborador}</div>
            <div className="text-sm text-gray-600">Estado: {t.estado}</div>
            <div className="text-sm text-gray-600">Inicio: {formatearHora(t.horaInicio)}</div>
            <div className="text-sm text-gray-600">Finalizado el: {formatearFechaHora(t.horaFin)}</div>
            <div className="text-sm text-gray-600">Duración: {formatearTiempo(t.tiempo)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}