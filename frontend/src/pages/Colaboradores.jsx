import { useEffect, useState } from "react";

function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/colaboradores")
      .then((res) => res.json())
      .then((data) => setColaboradores(data))
      .catch((err) => console.error("Error al cargar colaboradores", err));
  }, []);

  const agregarColaborador = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const res = await fetch("http://localhost:3001/colaboradores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoNombre }),
    });

    const data = await res.json();
    if (res.ok) {
      setColaboradores([...colaboradores, data]);
      setNuevoNombre("");
    } else {
      alert("Error al agregar colaborador");
    }
  };

  const eliminarColaborador = async (id) => {
    if (!confirm("¿Seguro que querés eliminar este colaborador?")) return;

    const res = await fetch(`http://localhost:3001/colaboradores/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setColaboradores(colaboradores.filter((c) => c.id !== id));
    } else {
      alert("Error al eliminar colaborador");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <form
        onSubmit={agregarColaborador}
        className="bg-neutral-800 p-4 mb-6 rounded-xl shadow-md flex flex-wrap gap-4 items-center"
      >
        <input
          type="text"
          placeholder="Nuevo colaborador"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          className="p-2 border border-gray-600 rounded w-64 text-white bg-neutral-700 placeholder-gray-400"
          required
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
        >
          Agregar
        </button>
      </form>

      <table className="w-full bg-neutral-800 text-white border border-neutral-700 rounded shadow text-sm">
        <thead className="bg-neutral-700 text-green-400 uppercase text-xs">
          <tr>
            <th className="px-3 py-2 text-left">ID</th>
            <th className="px-3 py-2 text-left">Nombre</th>
            <th className="px-3 py-2 text-left">Eliminar</th>
          </tr>
        </thead>
        <tbody>
          {colaboradores.map((c) => (
            <tr key={c.id} className="border-t border-neutral-700 hover:bg-neutral-700">
              <td className="p-2">{c.id}</td>
              <td className="p-2">{c.nombre}</td>
              <td className="p-2">
                <button
                  onClick={() => eliminarColaborador(c.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  🗑 Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Colaboradores;