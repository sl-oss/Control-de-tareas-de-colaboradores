import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PresentacionImpuestos() {
  const [datos, setDatos] = useState([]);
  const [periodo, setPeriodo] = useState("");
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", persona: "Natural" });
  const [colaboradores, setColaboradores] = useState([]);

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

  const obtenerColaboradores = async () => {
    try {
      const res = await axios.get("https://control-de-tareas-de-colaboradores.onrender.com/colaboradores");
      setColaboradores(res.data.map(c => c.nombre));
    } catch (error) {
      alert("Error al obtener colaboradores");
    }
  };

  const copiarClientesDelMesAnterior = async () => {
    if (!periodo) return alert("Selecciona un período válido");

    const mesAnterior = (() => {
      const [a, m] = periodo.split("-").map(Number);
      const fecha = new Date(a, m - 1);
      fecha.setMonth(fecha.getMonth() - 1);
      return fecha.toISOString().slice(0, 7);
    })();

    try {
      const res = await axios.get("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-impuestos", {
        params: { periodo: mesAnterior }
      });

      const clientes = res.data;
      const nuevos = clientes.map(c => ({
        nombre: c.nombre,
        tipo_persona: c.tipo_persona,
        periodo,
        documentos_solicitados: false,
        documentos_proporcionados: false,
        declaraciones_presentadas: false,
        mandamientos_entregados: false,
        fecha_entregado: null,
        comentario: "",
        colaborador: ""
      }));

      const guardados = await Promise.all(
        nuevos.map(n =>
          axios.post("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-impuestos", n).then(res => res.data)
        )
      );

      setDatos(prev => [...prev, ...guardados]);
      alert("Clientes copiados del mes anterior correctamente");
    } catch (error) {
      alert("Error al copiar clientes del mes anterior");
    }
  };

  useEffect(() => {
    obtenerColaboradores();
  }, []);

  useEffect(() => {
    if (periodo) obtenerDatos();
  }, [periodo]);

  const actualizarCampo = async (id, campo, valor) => {
    const copia = [...datos];
    const index = copia.findIndex(d => d.id === id);
    copia[index][campo] = valor;
    setDatos(copia);
    try {
      await axios.put(`https://control-de-tareas-de-colaboradores.onrender.com/presentacion-impuestos/${id}`, copia[index]);
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const actualizarPeriodo = async (id, nuevoPeriodo) => {
    actualizarCampo(id, "periodo", nuevoPeriodo);
  };

  const eliminarCliente = async (id) => {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
      await axios.delete(`https://control-de-tareas-de-colaboradores.onrender.com/presentacion-impuestos/${id}`);
      setDatos(datos.filter(d => d.id !== id));
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  const crearRegistro = async () => {
    const { nombre, persona } = nuevoCliente;
    if (!nombre || !persona || !periodo) return alert("Nombre, tipo de persona y período son obligatorios");
    try {
      const res = await axios.post("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-impuestos", {
        nombre,
        tipo_persona: persona,
        periodo,
        colaborador: "",
        comentario: "",
        documentos_solicitados: false,
        documentos_proporcionados: false,
        declaraciones_presentadas: false,
        mandamientos_entregados: false,
        fecha_entregado: null
      });
      setDatos([...datos, res.data]);
      setNuevoCliente({ nombre: "", persona: "Natural" });
    } catch (error) {
      alert("Error al crear cliente");
    }
  };

  const exportarExcel = () => {
    const hoja = [
      ["Presentación de Impuestos (IVA y PAC)"],
      ["Periodo:", periodo],
      [],
      ["Personas Naturales"],
      ["Cliente", "Doc. Solicitados", "Doc. Recibidos", "Declaración", "Mandamientos", "Fecha Entrega", "Comentario", "Colaborador"],
      ...datos.filter(d => d.tipo_persona?.toLowerCase() === "natural").map(d => [
        d.nombre,
        d.documentos_solicitados ? "✔" : "",
        d.documentos_proporcionados ? "✔" : "",
        d.declaraciones_presentadas ? "✔" : "",
        d.mandamientos_entregados ? "✔" : "",
        d.fecha_entregado?.split("T")[0] || "",
        d.comentario || "",
        d.colaborador || ""
      ]),
      [],
      ["Personas Jurídicas"],
      ["Cliente", "Doc. Solicitados", "Doc. Recibidos", "Declaración", "Mandamientos", "Fecha Entrega", "Comentario", "Colaborador"],
      ...datos.filter(d => d.tipo_persona?.toLowerCase() === "juridica").map(d => [
        d.nombre,
        d.documentos_solicitados ? "✔" : "",
        d.documentos_proporcionados ? "✔" : "",
        d.declaraciones_presentadas ? "✔" : "",
        d.mandamientos_entregados ? "✔" : "",
        d.fecha_entregado?.split("T")[0] || "",
        d.comentario || "",
        d.colaborador || ""
      ])
    ];

    const libro = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(hoja);
    XLSX.utils.book_append_sheet(libro, ws, "Impuestos");
    const excel = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excel]), `Presentacion_Impuestos_${periodo}.xlsx`);
  };

  const colores = {
    "Silvia Baires": "#FFFFCC",
    "Erick Arévalo": "#FFC000",
    "Álvaro Melara": "#00FFFF",
    "Didier Ortiz": "#00FF00",
    "Rodrigo Pineda": "#FFFFFF"
  };

  const renderFila = (d) => {
    const colorFondo = colores[d.colaborador] || "white";
    return (
      <tr key={d.id} className="text-sm" style={{ backgroundColor: colorFondo }}>
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
          <select className="w-full" value={d.colaborador || ""} onChange={e => actualizarCampo(d.id, "colaborador", e.target.value)}>
            <option value="">--</option>
            {colaboradores.map(nombre => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>
        </td>
        <td className="border">
          <input
            type="month"
            value={d.periodo || ""}
            onChange={e => actualizarPeriodo(d.id, e.target.value)}
            className="w-full"
          />
        </td>
        <td className="border text-center">
          <button onClick={() => eliminarCliente(d.id)} className="text-red-600 hover:underline">🗑️</button>
        </td>
      </tr>
    );
  };

  const naturales = datos.filter(d => d.tipo_persona?.toLowerCase() === 'natural');
  const juridicas = datos.filter(d => d.tipo_persona?.toLowerCase() === 'juridica');

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Presentación de Impuestos (IVA y PAC)</h2>

      <div className="mb-4 flex gap-4 flex-wrap">
        <input
          type="month"
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
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
        <button onClick={exportarExcel} className="bg-blue-600 text-white px-4 py-1 rounded shadow">📤 Exportar Excel</button>
        <button onClick={copiarClientesDelMesAnterior} className="bg-yellow-500 text-white px-4 py-1 rounded shadow">📋 Copiar del mes anterior</button>
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
            <th className="border px-2">📅 Mes</th>
            <th className="border px-2">🗑️</th>
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
            <th className="border px-2">📅 Mes</th>
            <th className="border px-2">🗑️</th>
          </tr>
        </thead>
        <tbody>
          {juridicas.map(renderFila)}
        </tbody>
      </table>
    </div>
  );
}