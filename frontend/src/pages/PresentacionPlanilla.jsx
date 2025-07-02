import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PresentacionPlanilla() {
  const [datos, setDatos] = useState([]);
  const [periodo, setPeriodo] = useState("");

  const obtenerDatos = async () => {
    try {
      const res = await axios.get("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-planilla", {
        params: { periodo }
      });
      setDatos(res.data);
    } catch (error) {
      alert("Error al obtener datos");
    }
  };

  useEffect(() => {
    if (periodo) obtenerDatos();
  }, [periodo]);

  const actualizarCampo = async (id, campo, valor) => {
    const copia = [...datos];
    const index = copia.findIndex(d => d.id === id);
    copia[index][campo] = valor;
    setDatos(copia);

    try {
      await axios.put(`https://control-de-tareas-de-colaboradores.onrender.com/presentacion-planilla/${id}`, copia[index]);
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const crearRegistro = async () => {
    const nombre = prompt("Nombre del cliente");
    const persona = prompt("Tipo de persona (Natural o Juridica)");
    if (!nombre || !persona) return;

    try {
      const res = await axios.post("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-planilla", {
        persona,
        periodo,
        nombre,
        colaborador: "",
        comentario: "",
        detalles_cambios: ""
      });
      setDatos([...datos, res.data]);
    } catch (error) {
      alert("Error al crear registro");
    }
  };

  const exportarExcel = () => {
    const hoja = [
      ["Presentación de Planilla Única"],
      ["Periodo:", periodo],
      [],
      ["Personas Naturales"],
      ["Cliente", "Cambios Solicitados", "Planilla Detalle", "Aprobada", "Mandamientos", "Fecha Entrega", "Comentario", "Colaborador"],
      ...datos.filter(d => d.persona?.toLowerCase() === "natural").map(d => [
        d.nombre,
        d.detalles_cambios || "",
        d.planilla_detalle ? "✔" : "",
        d.planilla_aprobada ? "✔" : "",
        d.mandamientos_entregados ? "✔" : "",
        d.fecha_entregado?.split("T")[0] || "",
        d.comentario || "",
        d.colaborador || ""
      ]),
      [],
      ["Personas Jurídicas"],
      ["Cliente", "Cambios Solicitados", "Planilla Detalle", "Aprobada", "Mandamientos", "Fecha Entrega", "Comentario", "Colaborador"],
      ...datos.filter(d => d.persona?.toLowerCase() === "juridica").map(d => [
        d.nombre,
        d.detalles_cambios || "",
        d.planilla_detalle ? "✔" : "",
        d.planilla_aprobada ? "✔" : "",
        d.mandamientos_entregados ? "✔" : "",
        d.fecha_entregado?.split("T")[0] || "",
        d.comentario || "",
        d.colaborador || ""
      ])
    ];

    const libro = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(hoja);
    XLSX.utils.book_append_sheet(libro, ws, "Planilla");
    const excel = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excel]), `Presentacion_Planilla_${periodo}.xlsx`);
  };

  const renderFila = (d) => (
    <tr key={d.id} className="text-sm">
      <td className="border px-2 py-1">{d.nombre}</td>
      <td className="border">
        <input type="text" className="w-full" value={d.detalles_cambios || ''} onChange={e => actualizarCampo(d.id, 'detalles_cambios', e.target.value)} />
      </td>
      {['planilla_detalle', 'planilla_aprobada', 'mandamientos_entregados'].map(campo => (
        <td key={campo} className="border text-center">
          <input type="checkbox" checked={d[campo]} onChange={e => actualizarCampo(d.id, campo, e.target.checked)} />
        </td>
      ))}
      <td className="border">
        <input type="date" className="w-full" value={d.fecha_entregado?.split('T')[0] || ''} onChange={e => actualizarCampo(d.id, 'fecha_entregado', e.target.value)} />
      </td>
      <td className="border">
        <input type="text" className="w-full" value={d.comentario || ''} onChange={e => actualizarCampo(d.id, 'comentario', e.target.value)} />
      </td>
      <td className="border">
        <input type="text" className="w-full" value={d.colaborador || ''} onChange={e => actualizarCampo(d.id, 'colaborador', e.target.value)} />
      </td>
    </tr>
  );

  const naturales = datos.filter(d => d.persona?.toLowerCase() === 'natural');
  const juridicas = datos.filter(d => d.persona?.toLowerCase() === 'juridica');

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Presentación de Planilla Única</h2>

      <div className="mb-4 flex gap-4 flex-wrap">
        <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="border rounded px-2 py-1" />
        <button onClick={crearRegistro} className="bg-green-600 text-white px-4 py-1 rounded shadow">+ Cliente</button>
        <button onClick={exportarExcel} className="bg-blue-600 text-white px-4 py-1 rounded shadow">📤 Exportar Excel</button>
      </div>

      <h3 className="text-lg font-semibold mt-4 mb-2">Personas Naturales</h3>
      <table className="w-full border text-left mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Cliente</th>
            <th className="border px-2">🛠 Cambios Solicitados</th>
            <th className="border px-2">📄 Planilla Detalle</th>
            <th className="border px-2">✅ Aprobada</th>
            <th className="border px-2">📬 Mandamientos</th>
            <th className="border px-2">📆 Fecha Entrega</th>
            <th className="border px-2">📝 Comentario</th>
            <th className="border px-2">👤 Colaborador</th>
          </tr>
        </thead>
        <tbody>
          {naturales.map(renderFila)}
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-4 mb-2">Personas Jurídicas</h3>
      <table className="w-full border text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Cliente</th>
            <th className="border px-2">🛠 Cambios Solicitados</th>
            <th className="border px-2">📄 Planilla Detalle</th>
            <th className="border px-2">✅ Aprobada</th>
            <th className="border px-2">📬 Mandamientos</th>
            <th className="border px-2">📆 Fecha Entrega</th>
            <th className="border px-2">📝 Comentario</th>
            <th className="border px-2">👤 Colaborador</th>
          </tr>
        </thead>
        <tbody>
          {juridicas.map(renderFila)}
        </tbody>
      </table>
       </div>
  );
}