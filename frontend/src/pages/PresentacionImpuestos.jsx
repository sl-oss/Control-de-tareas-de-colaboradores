import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PresentacionImpuestos() {
  const [datos, setDatos] = useState([]);
  const [periodo, setPeriodo] = useState("");
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", persona: "Natural" });

  const obtenerDatos = async () => {
    try {
      const res = await axios.get("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-impuestos", {
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
      await axios.put(`https://control-de-tareas-de-colaboradores.onrender.com/presentacion-impuestos/${id}`, {
        ...copia[index]
      });
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const crearRegistro = async () => {
    const { nombre, persona } = nuevoCliente;
    if (!nombre || !persona || !periodo) return alert("Nombre, tipo de persona y período son obligatorios");
    try {
      const res = await axios.post("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-impuestos", {
        nombre,
        persona,
        periodo,
        colaborador: "",
        comentario: ""
      });
      setDatos([...datos, res.data]);
      setNuevoCliente({ nombre: "", persona: "Natural" });
    } catch (error) {
      alert("Error al crear cliente");
    }
  };

  const naturales = datos.filter(d => d.persona?.toLowerCase() === 'natural');
  const juridicas = datos.filter(d => d.persona?.toLowerCase() === 'juridica');

  const renderFila = (d) => (
    <tr key={d.id} className="text-sm">
      <td className="border px-2 py-1">{d.nombre}</td>
      {["documentos_solicitados", "documentos_proporcionados", "declaraciones_presentadas", "mandamientos_entregados"].map(campo => (
        <td key={campo} className="border text-center">
          <input type="checkbox" checked={d[campo]} onChange={e => actualizarCampo(d.id, campo, e.target.checked)} />
        </td>
      ))}
      <td className="border">
        <input type="date" className="w-full" value={d.fecha_entregado?.split("T")[0] || ""} onChange={e => actualizarCampo(d.id, "fecha_entregado", e.target.value)} />
      </td>
      <td className="border">
        <input type="text" className="w-full" value={d.comentario || ""} onChange={e => actualizarCampo(d.id, "comentario", e.target.value)} />
      </td>
      <td className="border">
        <input type="text" className="w-full" value={d.colaborador || ""} onChange={e => actualizarCampo(d.id, "colaborador", e.target.value)} />
      </td>
    </tr>
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Presentación de Impuestos (IVA y PAC)</h2>

      <div className="mb-4 flex gap-4 flex-wrap">
        <input
          type="date"
          value={periodo ? `${periodo}-01` : ""}
          onChange={e => {
            const fecha = e.target.value;
            const soloMes = fecha.slice(0, 7);
            setPeriodo(soloMes);
          }}
          className="border rounded px-2 py-1"
        />

        <input
          type="text"
          placeholder="Nuevo cliente"
          value={nuevoCliente.nombre}
          onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
          className="border px-2 py-1 rounded"
        />

        <select
          value={nuevoCliente.persona}
          onChange={e => setNuevoCliente({ ...nuevoCliente, persona: e.target.value })}
          className="border px-2 py-1 rounded"
        >
          <option value="Natural">Natural</option>
          <option value="Juridica">Juridica</option>
        </select>

        <button onClick={crearRegistro} className="bg-green-600 text-white px-4 py-1 rounded shadow">+ Cliente</button>
      </div>

      <h3 className="text-lg font-semibold mt-4 mb-2">Personas Naturales</h3>
      <table className="w-full border text-left mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Cliente</th>
            <th className="border px-2">📑 Doc. Solicitados</th>
            <th className="border px-2">📥 Doc. Recibidos</th>
            <th className="border px-2">📄 Declaración</th>
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
            <th className="border px-2">📑 Doc. Solicitados</th>
            <th className="border px-2">📥 Doc. Recibidos</th>
            <th className="border px-2">📄 Declaración</th>
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