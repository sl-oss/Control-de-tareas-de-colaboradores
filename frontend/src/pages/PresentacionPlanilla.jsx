import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PresentacionPlanilla() {
  const [datos, setDatos] = useState([]);
  const [periodo, setPeriodo] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("Natural");
  const [colaboradores, setColaboradores] = useState([]);

  const obtenerDatos = async () => {
    try {
      const res = await axios.get("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-planilla");
      setDatos(res.data.filter(d => d.periodo === periodo));
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
      const res = await axios.get("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-planilla");
      const clientes = res.data.filter(d => d.periodo === mesAnterior);

      const nuevos = clientes.map(c => ({
        nombre: c.nombre,
        tipo_persona: c.tipo_persona,
        periodo,
        detalles_cambios: false,
        detalle_compartido: false,
        planilla_aprobada: false,
        mandamientos_entregados: false,
        fecha_entregado: null,
        comentario: "",
        colaborador: ""
      }));

      const guardados = await Promise.all(
        nuevos.map(n =>
          axios.post("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-planilla", n).then(res => res.data)
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
      await axios.put(`https://control-de-tareas-de-colaboradores.onrender.com/presentacion-planilla/${id}`, copia[index]);
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
      await axios.delete(`https://control-de-tareas-de-colaboradores.onrender.com/presentacion-planilla/${id}`);
      setDatos(datos.filter(d => d.id !== id));
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  const crearRegistro = async () => {
    if (!nuevoNombre || !nuevoTipo || !periodo) {
      alert("Debes ingresar nombre, tipo de persona y seleccionar el período");
      return;
    }

    try {
      const nuevo = {
        nombre: nuevoNombre,
        tipo_persona: nuevoTipo,
        periodo,
        colaborador: "",
        comentario: "",
        detalles_cambios: false,
        detalle_compartido: false,
        planilla_aprobada: false,
        mandamientos_entregados: false,
        fecha_entregado: null
      };

      const res = await axios.post("https://control-de-tareas-de-colaboradores.onrender.com/presentacion-planilla", nuevo);
      setDatos([...datos, res.data]);
      setNuevoNombre("");
      setNuevoTipo("Natural");
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.error || "Ya existe este cliente en ese período");
      } else {
        alert("Error al crear registro");
      }
    }
  };

  const exportarExcel = () => {
    const hoja = [
      ["Presentación de Planilla Única"],
      ["Periodo:", periodo],
      [],
      ["Personas Naturales"],
      ["Cliente", "Cambios Solicitados", "Planilla Detalle", "Aprobada", "Mandamientos", "Fecha Entrega", "Comentario", "Colaborador"],
      ...datos.filter(d => d.tipo_persona?.toLowerCase() === "natural").map(d => [
        d.nombre,
        d.detalles_cambios ? "✔" : "",
        d.detalle_compartido ? "✔" : "",
        d.planilla_aprobada ? "✔" : "",
        d.mandamientos_entregados ? "✔" : "",
        d.fecha_entregado?.split("T")[0] || "",
        d.comentario || "",
        d.colaborador || ""
      ]),
      [],
      ["Personas Jurídicas"],
      ["Cliente", "Cambios Solicitados", "Planilla Detalle", "Aprobada", "Mandamientos", "Fecha Entrega", "Comentario", "Colaborador"],
      ...datos.filter(d => d.tipo_persona?.toLowerCase() === "juridica").map(d => [
        d.nombre,
        d.detalles_cambios ? "✔" : "",
        d.detalle_compartido ? "✔" : "",
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
        {["detalles_cambios", "detalle_compartido", "planilla_aprobada", "mandamientos_entregados"].map(campo => (
          <td key={campo} className="border text-center">
            <input type="checkbox" checked={!!d[campo]} onChange={e => actualizarCampo(d.id, campo, e.target.checked)} />
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

  const naturales = datos.filter(d => d.tipo_persona?.toLowerCase() === "natural");
  const juridicas = datos.filter(d => d.tipo_persona?.toLowerCase() === "juridica");

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Presentación de Planilla Única</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="month"
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="Nombre del cliente"
          value={nuevoNombre}
          onChange={e => setNuevoNombre(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <select
          value={nuevoTipo}
          onChange={e => setNuevoTipo(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="Natural">Natural</option>
          <option value="Juridica">Jurídica</option>
        </select>
        <button onClick={crearRegistro} className="bg-green-600 text-white px-4 py-1 rounded shadow">
          + Cliente
        </button>
        <button onClick={exportarExcel} className="bg-blue-600 text-white px-4 py-1 rounded shadow">
          📤 Exportar Excel
        </button>
        <button onClick={copiarClientesDelMesAnterior} className="bg-yellow-500 text-white px-4 py-1 rounded shadow">
          📋 Copiar del mes anterior
        </button>
      </div>

      <h3 className="text-lg font-semibold mt-4 mb-2">Personas Naturales</h3>
      <table className="w-full border text-left mb-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Cliente</th>
            <th className="border px-2">🛠 Cambios</th>
            <th className="border px-2">📄 Detalle</th>
            <th className="border px-2">✅ Aprobada</th>
            <th className="border px-2">📬 Mandamientos</th>
            <th className="border px-2">📆 Entrega</th>
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
            <th className="border px-2">🛠 Cambios</th>
            <th className="border px-2">📄 Detalle</th>
            <th className="border px-2">✅ Aprobada</th>
            <th className="border px-2">📬 Mandamientos</th>
            <th className="border px-2">📆 Entrega</th>
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