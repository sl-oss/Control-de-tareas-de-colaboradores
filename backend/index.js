// backend/index.js
require('dotenv').config();                 // ← lee las variables de .env
const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app    = express();
const PORT   = process.env.PORT || 3001;
const SECRET = process.env.SECRET || 'super-clave-secreta';

// ───── Supabase (PostgreSQL) ─────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { auth: { persistSession: false } }      // desactiva cookies
);

// ───── Middlewares ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ───── Seeder inicial (usuarios + colaboradores) ────────────────
(async () => {
  const usuariosSeed = [
    {
      usuario: 'rodpineda15@gmail.com',
      contraseña: 'Ganaroganarx100pre',
      rol: 'admin'
    },
    {
      usuario: 'operaciones.paconsultores@gmail.com',
      contraseña: 'EquipoPA2025',
      rol: 'colaborador'
    }
  ];

  for (const u of usuariosSeed) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('usuario', u.usuario)
      .limit(1);

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
    const { data } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('nombre', nombre)
      .limit(1);

    if (!data || data.length === 0) {
      await supabase.from('colaboradores').insert({ nombre });
    }
  }
})();

// ───── Rutas de autenticación ───────────────────────────────────
app.post('/login', async (req, res) => {
  const { usuario, contraseña } = req.body;

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });

  const user = data && data.length ? data[0] : null;

  if (!user || !bcrypt.compareSync(contraseña, user.contraseña)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ usuario: user.usuario, rol: user.rol }, SECRET, {
    expiresIn: '1h'
  });
  res.json({ token, rol: user.rol });
});

// ───── Rutas de tareas ──────────────────────────────────────────
app.get('/tareas', async (_req, res) => {
  const { data, error } = await supabase.from('tareas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/tareas', async (req, res) => {
  const { descripcion, colaborador, fechaEntrega } = req.body;

  const { data, error } = await supabase.from('tareas').insert({
    descripcion,
    colaborador,
    fechaEntrega,
    estado: 'No iniciada'
  }).select('id').limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ id: data && data.length ? data[0].id : null });
});

app.put('/tareas/:id', async (req, res) => {
  const { estado, horaInicio, horaFin, tiempo } = req.body;
  const { id } = req.params;

  const { error } = await supabase
    .from('tareas')
    .update({ estado, horaInicio, horaFin, tiempo })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Tarea actualizada' });
});

app.delete('/tareas/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tareas').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Tarea eliminada' });
});

// ───── Rutas de colaboradores ───────────────────────────────────
app.get('/colaboradores', async (_req, res) => {
  const { data, error } = await supabase.from('colaboradores').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/colaboradores', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  const { data, error } = await supabase
    .from('colaboradores')
    .insert({ nombre })
    .select('id, nombre')
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data && data.length ? data[0] : {});
});

app.delete('/colaboradores/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('colaboradores').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ mensaje: 'Colaborador eliminado' });
});

// ───── Reporte: tareas no iniciadas ─────────────────────────────
app.get('/reporte-no-iniciadas', async (req, res) => {
  const { colaborador } = req.query;

  let query = supabase.from('tareas')
    .select('id, descripcion, colaborador, fechaEntrega')
    .eq('estado', 'No iniciada');

  if (colaborador) query = query.eq('colaborador', colaborador);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// ───── Reporte: resumen por colaborador ─────────────────────────
app.get('/reporte-resumen', async (_req, res) => {
  const { data: tareas, error } = await supabase.from('tareas').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const resumen = {};
  tareas.forEach(t => {
    if (!resumen[t.colaborador]) {
      resumen[t.colaborador] = {
        noIniciadas: 0,
        enProceso: 0,
        finalizadas: 0,
        puntuales: 0
      };
    }
    if (t.estado === 'No iniciada') resumen[t.colaborador].noIniciadas++;
    if (t.estado === 'En proceso')  resumen[t.colaborador].enProceso++;
    if (t.estado === 'Finalizado')  {
      resumen[t.colaborador].finalizadas++;
      const entrega = new Date(t.fechaEntrega);
      const fin     = new Date(t.horaFin);
      if (fin <= entrega.setHours(23,59,59,999)) {
        resumen[t.colaborador].puntuales++;
      }
    }
  });

  const resultado = Object.entries(resumen).map(([colaborador, r]) => {
    const porcentaje = r.finalizadas ? (r.puntuales / r.finalizadas) : 0;
    return {
      colaborador,
      ...r,
      estrellas: Math.floor(porcentaje * 5),
      comentario: porcentaje >= 0.6 ? 'Excelente' : 'Necesita mejorar'
    };
  });

  res.json(resultado);
});

// ───── Iniciar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});