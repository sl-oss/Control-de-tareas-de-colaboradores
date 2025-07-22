require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET = process.env.SECRET || 'super-clave-secreta';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }
);

app.use(cors());
app.use(express.json());

// 🔁 Seed de usuarios y colaboradores
(async () => {
  const usuariosSeed = [
    { usuario: 'rodpineda15@gmail.com', contraseña: 'Ganaroganarx100pre', rol: 'admin' },
    { usuario: 'operaciones.paconsultores@gmail.com', contraseña: 'EquipoPA2025', rol: 'colaborador' }
  ];

  for (const u of usuariosSeed) {
    const { data } = await supabase.from('usuarios').select('id').eq('usuario', u.usuario).limit(1);
    if (!data || data.length === 0) {
      await supabase.from('usuarios').insert({
        usuario: u.usuario,
        contraseña: bcrypt.hashSync(u.contraseña, 10),
        rol: u.rol
      });
    }
  }

  const colaboradoresSeed = [
    'Didier Ortiz',
    'Álvaro Melara',
    'Erick Arévalo',
    'Rodrigo Pineda',
    'Silvia Baires'
  ];

  for (const nombre of colaboradoresSeed) {
    const { data } = await supabase.from('colaboradores').select('id').eq('nombre', nombre).limit(1);
    if (!data || data.length === 0) {
      await supabase.from('colaboradores').insert({ nombre });
    }
  }
})();

// 🔐 Login
app.post('/login', async (req, res) => {
  const { usuario, contraseña } = req.body;
  const { data, error } = await supabase.from('usuarios').select('*').eq('usuario', usuario).limit(1);

  if (error) return res.status(500).json({ error: error.message });

  const user = data?.[0];
  if (!user || !bcrypt.compareSync(contraseña, user.contraseña)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ usuario: user.usuario, rol: user.rol }, SECRET, { expiresIn: '1h' });
  res.json({ token, rol: user.rol });
});

// 📄 Obtener tareas activas
app.get('/tareas', async (_req, res) => {
  const { data, error } = await supabase.from('tareas').select('*').eq('archivada', false);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 📁 Tareas finalizadas
app.get('/tareas/finalizadas', async (_req, res) => {
  const { data, error } = await supabase.from('tareas').select('*').eq('estado', 'Finalizado').eq('archivada', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ➕ Crear tarea
app.post('/tareas', async (req, res) => {
  const { descripcion, colaborador, fechaEntrega } = req.body;
  const { data, error } = await supabase
    .from('tareas')
    .insert({
      descripcion,
      colaborador,
      fechaEntrega,
      estado: 'No iniciada',
      archivada: false
    })
    .select('id')
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data?.[0]?.id || null });
});

// ✏️ Actualizar tarea
app.put('/tareas/:id', async (req, res) => {
  const { id } = req.params;
  const { descripcion, colaborador, fechaEntrega, estado, horaInicio, horaFin, tiempo } = req.body;

  const actualizacion = {
    ...(descripcion !== undefined && { descripcion }),
    ...(colaborador !== undefined && { colaborador }),
    ...(fechaEntrega !== undefined && { fechaEntrega }),
    ...(estado !== undefined && { estado }),
    horaInicio: horaInicio ?? null,
    horaFin: horaFin ?? null,
    tiempo: tiempo ?? null
  };

  const { error } = await supabase.from('tareas').update(actualizacion).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ mensaje: 'Tarea actualizada correctamente' });
});

// 📦 Archivar tarea
app.put('/tareas/archivar/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tareas').update({ archivada: true }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Tarea archivada correctamente' });
});

// 🗑️ Eliminar tarea
app.delete('/tareas/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tareas').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Tarea eliminada correctamente' });
});

// 👥 Colaboradores
app.get('/colaboradores', async (_req, res) => {
  const { data, error } = await supabase.from('colaboradores').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/colaboradores', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  const { data, error } = await supabase.from('colaboradores').insert({ nombre }).select('id, nombre').limit(1);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data?.[0] || {});
});

app.delete('/colaboradores/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('colaboradores').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Colaborador eliminado correctamente' });
});

// 📊 Reportes
app.get('/reporte-no-iniciadas', async (req, res) => {
  const { colaborador } = req.query;
  let query = supabase.from('tareas').select('id, descripcion, colaborador, fechaEntrega').eq('estado', 'No iniciada');
  if (colaborador) query = query.eq('colaborador', colaborador);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/reporte-resumen', async (_req, res) => {
  const { data: tareas, error } = await supabase.from('tareas').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const resumen = {};
  tareas.forEach(t => {
    if (!resumen[t.colaborador]) {
      resumen[t.colaborador] = { noIniciadas: 0, enProceso: 0, finalizadas: 0, puntuales: 0 };
    }
    if (t.estado === 'No iniciada') resumen[t.colaborador].noIniciadas++;
    if (t.estado === 'En proceso') resumen[t.colaborador].enProceso++;
    if (t.estado === 'Finalizado') {
      resumen[t.colaborador].finalizadas++;
      const entrega = new Date(t.fechaEntrega);
      const fin = new Date(t.horaFin);
      if (fin <= entrega.setHours(23, 59, 59, 999)) {
        resumen[t.colaborador].puntuales++;
      }
    }
  });

  const resultado = Object.entries(resumen).map(([colaborador, r]) => {
    const porcentaje = r.finalizadas ? r.puntuales / r.finalizadas : 0;
    return {
      colaborador,
      ...r,
      estrellas: Math.floor(porcentaje * 5),
      comentario: porcentaje >= 0.6 ? 'Excelente' : 'Necesita mejorar'
    };
  });

  res.json(resultado);
});

// 📥 Presentación de impuestos
app.get('/presentacion-impuestos', async (req, res) => {
  const { periodo } = req.query;
  let query = supabase.from('presentacion_impuestos').select('*');
  if (periodo) query = query.eq('periodo', periodo);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/presentacion-impuestos', async (req, res) => {
  const { nombre, periodo } = req.body;
  if (!nombre || !periodo) return res.status(400).json({ error: 'Nombre y período son obligatorios' });

  const { data: existente, error: errorConsulta } = await supabase
    .from('presentacion_impuestos')
    .select('id')
    .eq('nombre', nombre)
    .eq('periodo', periodo)
    .limit(1);

  if (errorConsulta) return res.status(500).json({ error: errorConsulta.message });
  if (existente && existente.length > 0) return res.status(400).json({ error: 'Ya existe este cliente en ese período' });

  const nuevo = { ...req.body, creado_en: new Date().toISOString() };
  const { data, error } = await supabase.from('presentacion_impuestos').insert(nuevo).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/presentacion-impuestos/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('presentacion_impuestos').update(req.body).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Presentación de impuestos actualizada' });
});

app.delete('/presentacion-impuestos/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('presentacion_impuestos').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Registro de impuestos eliminado correctamente' });
});

// 📥 Presentación de planilla
app.get('/presentacion-planilla', async (_req, res) => {
  const { data, error } = await supabase.from('presentacion_planilla').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/presentacion-planilla', async (req, res) => {
  const { nombre, periodo } = req.body;
  if (!nombre || !periodo) return res.status(400).json({ error: 'Nombre y período son obligatorios' });

  const { data: existente, error: errorConsulta } = await supabase
    .from('presentacion_planilla')
    .select('id')
    .eq('nombre', nombre)
    .eq('periodo', periodo)
    .limit(1);

  if (errorConsulta) return res.status(500).json({ error: errorConsulta.message });
  if (existente && existente.length > 0) return res.status(400).json({ error: 'Ya existe este cliente en ese período' });

  const nuevo = { ...req.body, creado_en: new Date().toISOString() };
  const { data, error } = await supabase.from('presentacion_planilla').insert(nuevo).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/presentacion-planilla/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('presentacion_planilla').update(req.body).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Presentación de planilla actualizada' });
});

app.delete('/presentacion-planilla/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('presentacion_planilla').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Registro de planilla eliminado correctamente' });
});

const ExcelJS = require("exceljs");

app.post('/exportar-excel-finalizadas', async (req, res) => {
  try {
    const tareas = req.body.tareas;

    if (!Array.isArray(tareas) || tareas.length === 0) {
      return res.status(400).json({ error: "No se recibieron tareas para exportar." });
    }

    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Tareas Finalizadas");

    sheet.columns = [
      { header: "#", key: "num", width: 5 },
      { header: "Tarea", key: "descripcion", width: 40 },
      { header: "Colaborador", key: "colaborador", width: 25 },
      { header: "Estado", key: "estado", width: 15 },
      { header: "Inicio", key: "inicio", width: 22 },
      { header: "Finalizado", key: "finalizado", width: 22 },
      { header: "Duración", key: "duracion", width: 18 },
    ];

    const formatearFecha = (iso) => {
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
      const dias = Math.floor(min / 1440);
      const horas = Math.floor((min % 1440) / 60);
      const minutos = min % 60;
      return `${dias}d ${horas}h ${minutos}min`;
    };

    tareas.forEach((t, i) => {
      sheet.addRow({
        num: i + 1,
        descripcion: t.descripcion,
        colaborador: t.colaborador,
        estado: t.estado,
        inicio: formatearFecha(t.horaInicio),
        finalizado: formatearFecha(t.horaFin),
        duracion: formatearTiempo(t.tiempo),
      });
    });

    // Estilo tabla
    sheet.autoFilter = { from: 'A1', to: 'G1' };
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCE5FF" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // encabezado ya tiene estilo
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=reporte_tareas_finalizadas.xlsx");
    res.send(buffer);
  } catch (error) {
    console.error("Error generando Excel:", error);
    res.status(500).send("No se pudo generar el Excel.");
  }
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});