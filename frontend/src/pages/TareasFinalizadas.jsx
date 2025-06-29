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

  const generarWord = async () => {
    try {
      const doc = new Document({
        creator: "Control de Tareas",
        title: "Reporte de Tareas Finalizadas",
        description: "Tareas finalizadas archivadas"
      });

      doc.addSection({
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "📋 Reporte de Tareas Finalizadas",
                bold: true,
                size: 28,
                break: 1
              })
            ],
          }),
          ...tareas.map(t =>
            new Paragraph({
              spacing: { after: 150 },
              children: [
                new TextRun({ text: `Tarea: ${t.descripcion}`, bold: true, break: 1 }),
                new TextRun({ text: `Colaborador: ${t.colaborador}`, break: 1 }),
                new TextRun({ text: `Estado: ${t.estado}`, break: 1 }),
                new TextRun({ text: `Inicio: ${formatearHora(t.horaInicio)}`, break: 1 }),
                new TextRun({ text: `Fin: ${formatearHora(t.horaFin)}`, break: 1 }),
                new TextRun({ text: `Duración: ${formatearTiempo(t.tiempo)}`, break: 1 }),
              ]
            })
          )
        ]
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
      <button
        onClick={generarWord}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
      >
        Descargar Word
      </button>
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