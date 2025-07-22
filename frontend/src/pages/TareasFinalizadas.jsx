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
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    fetch("https://control-de-tareas-de-colaboradores.onrender.com/tareas/finalizadas")
      .then((res) => res.json())
      .then((data) => setTareas(data));
  }, []);

  const formatearFechaHora = (iso) => {
    if (!iso) return "-";
    const fecha = new Date(iso);
    return fecha.toLocaleString("es-SV", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatearTiempo = (min) => {
    if (!min && min !== 0) return "-";
    const dias = Math.floor(min / 1440);
    const horas = Math.floor((min % 1440) / 60);
    const minutos = min % 60;
    return `${dias}d ${horas}h ${minutos}min`;
  };

  const filtrarTareas = (tarea) => {
    const fechaFin = new Date(tarea.horaFin);
    const desdeFecha = desde ? new Date(desde) : null;
    const hastaFecha = hasta ? new Date(hasta) : null;
    const coincideColaborador = !colaboradorSeleccionado || tarea.colaborador === colaboradorSeleccionado;
    const coincideFecha =
      (!desdeFecha || fechaFin >= desdeFecha) &&
      (!hastaFecha || fechaFin <= hastaFecha);
    return coincideColaborador && coincideFecha;
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
        ...tareas.filter(filtrarTareas).map(t =>
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: `Tarea: ${t.descripcion}`, bold: true, break: 1 }),
              new TextRun({ text: `Colaborador: ${t.colaborador}`, break: 1 }),
              new TextRun({ text: `Estado: ${t.estado}`, break: 1 }),
              new TextRun({ text: `Inicio: ${formatearFechaHora(t.horaInicio)}`, break: 1 }),
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

  const exportarExcelDesdeBackend = () => {
  const tareasFiltradas = tareas.filter(filtrarTareas);

  fetch("https://control-de-tareas-de-colaboradores.onrender.com/exportar-excel-finalizadas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tareas: tareasFiltradas }),
  })
    .then((res) => res.blob())
    .then((blob) => saveAs(blob, "reporte_tareas_finalizadas.xlsx"))
    .catch((err) => {
      console.error("Error al exportar Excel:", err);
      alert("Error al exportar Excel");
    });
};

  const colaboradoresUnicos = [...new Set(tareas.map(t => t.colaborador))];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tareas Finalizadas</h2>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label>Colaborador:</label>
        <select
          value={colaboradorSeleccionado}
          onChange={(e) => setColaboradorSeleccionado(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Todos</option>
          {colaboradoresUnicos.map((colab, i) => (
            <option key={i} value={colab}>{colab}</option>
          ))}
        </select>

        <label>Desde:</label>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="border px-2 py-1 rounded" />

        <label>Hasta:</label>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="border px-2 py-1 rounded" />

        <button
          onClick={() => {
            setColaboradorSeleccionado("");
            setDesde("");
            setHasta("");
          }}
          className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded shadow"
        >
          Quitar filtros
        </button>
      </div>

<div className="flex gap-4 mb-4">
  <button
    onClick={generarWord}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
  >
    Descargar Word
  </button>

  <button
    onClick={exportarExcelDesdeBackend}
    className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded shadow"
  >
    Descargar Excel PRO
  </button>
</div>

      <ul className="space-y-2">
        {tareas.filter(filtrarTareas).map((t) => (
          <li key={t.id} className="border p-3 rounded shadow bg-white">
            <div><strong>{t.descripcion}</strong> - {t.colaborador}</div>
            <div className="text-sm text-gray-600">Estado: {t.estado}</div>
            <div className="text-sm text-gray-600">Inicio: {formatearFechaHora(t.horaInicio)}</div>
            <div className="text-sm text-gray-600">Finalizado el: {formatearFechaHora(t.horaFin)}</div>
            <div className="text-sm text-gray-600">Duración: {formatearTiempo(t.tiempo)}</div>
          </li>
        ))}
      </ul>
    </div>
  );