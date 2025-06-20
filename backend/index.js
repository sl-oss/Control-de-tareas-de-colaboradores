// backend/index.js
const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const sqlite3  = require('sqlite3').verbose();

const app    = express();
const PORT   = 3001;
const SECRET = 'super-clave-secreta';

// ───── Middlewares ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ───── Base de datos ──────────────────────────────────────────────
const db = new sqlite3.Database('./usuarios.db', (err) => {
  if (err) console.error('Error al abrir SQLite', err.message);
});

// ── Tabla de usuarios
db.run(`CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE,
  contraseña TEXT,
  rol TEXT
)`);

// ── Inserta admin y colaborador por defecto
[
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
].forEach(u => {
  db.get("SELECT 1 FROM usuarios WHERE usuario = ?", [u.usuario], (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync(u.contraseña, 10);
      db.run("INSERT INTO usuarios (usuario, contraseña, rol) VALUES (?, ?, ?)",
        [u.usuario, hash, u.rol]);
    }
  });
});

// ── Tabla de tareas
db.run(`CREATE TABLE IF NOT EXISTS tareas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descripcion TEXT,
  colaborador TEXT,
  estado TEXT,
  horaInicio TEXT,
  horaFin TEXT,
  tiempo TEXT,
  fechaEntrega TEXT
)`);

// ── Tabla de colaboradores
db.run(`CREATE TABLE IF NOT EXISTS colaboradores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL
)`);

// Seed inicial de colaboradores si la tabla está vacía
db.get("SELECT COUNT(*) AS total FROM colaboradores", (err, row) => {
  if (row.total === 0) {
    [
      "Didier Ortiz",
      "Álvaro Melara",
      "Erick Arévalo",
      "Rodrigo Pineda",
      "Silvia Baires"
    ].forEach(nombre => {
      db.run("INSERT INTO colaboradores (nombre) VALUES (?)", [nombre]);
    });
  }
});

// ───── Rutas de autenticación ────────────────────────────────────
app.post('/login', (req, res) => {
  const { usuario, contraseña } = req.body;
  db.get("SELECT * FROM usuarios WHERE usuario = ?", [usuario], (err, row) => {
    if (err)   return res.status(500).json({ error: 'Error de servidor' });
    if (!row || !bcrypt.compareSync(contraseña, row.contraseña))
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ usuario: row.usuario, rol: row.rol }, SECRET, { expiresIn: '1h' });
    res.json({ token, rol: row.rol });
  });
});

// ───── Rutas de tareas ────────────────────────────────────────────
app.get('/tareas', (req, res) => {
  db.all("SELECT * FROM tareas", [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener tareas' });
    res.json(rows);
  });
});

app.post('/tareas', (req, res) => {
  const { descripcion, colaborador, fechaEntrega } = req.body;
  db.run(
    `INSERT INTO tareas (descripcion, colaborador, estado, fechaEntrega)
     VALUES (?, ?, 'No iniciada', ?)`,
    [descripcion, colaborador, fechaEntrega],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al crear tarea' });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/tareas/:id', (req, res) => {
  const { estado, horaInicio, horaFin, tiempo } = req.body;
  db.run(
    `UPDATE tareas
       SET estado = ?, horaInicio = ?, horaFin = ?, tiempo = ?
     WHERE id = ?`,
    [estado, horaInicio, horaFin, tiempo, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar tarea' });
      res.json({ mensaje: 'Tarea actualizada' });
    }
  );
});

app.delete('/tareas/:id', (req, res) => {
  db.run(`DELETE FROM tareas WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar tarea' });
    res.json({ mensaje: 'Tarea eliminada' });
  });
});

// ───── Rutas de colaboradores ────────────────────────────────────
app.get('/colaboradores', (req, res) => {
  db.all("SELECT * FROM colaboradores", [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener colaboradores' });
    res.json(rows);
  });
});

app.post('/colaboradores', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  db.run("INSERT INTO colaboradores (nombre) VALUES (?)", [nombre], function (err) {
    if (err) return res.status(500).json({ error: 'Error al crear colaborador' });
    res.json({ id: this.lastID, nombre });
  });
});

app.delete('/colaboradores/:id', (req, res) => {
  db.run("DELETE FROM colaboradores WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar colaborador' });
    res.json({ mensaje: 'Colaborador eliminado' });
  });
});

// ───── Reporte: tareas no iniciadas ──────────────────────────────
app.get('/reporte-no-iniciadas', (req, res) => {
  const { colaborador } = req.query;

  let sql = "SELECT id, descripcion, colaborador, fechaEntrega FROM tareas WHERE estado = 'No iniciada'";
  const params = [];

  if (colaborador) {
    sql += " AND colaborador = ?";
    params.push(colaborador);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener reporte' });
    res.json(rows);
  });
});

// ───── Reporte: resumen por colaborador ─────────────────────────────
app.get('/reporte-resumen', (req, res) => {
  const sql = `
    SELECT colaborador,
      SUM(CASE WHEN estado = 'No iniciada' THEN 1 ELSE 0 END) AS noIniciadas,
      SUM(CASE WHEN estado = 'En proceso' THEN 1 ELSE 0 END) AS enProceso,
      SUM(CASE WHEN estado = 'Finalizado' THEN 1 ELSE 0 END) AS finalizadas,
      SUM(CASE
            WHEN estado = 'Finalizado' AND 
                 date(horaFin) <= date(fechaEntrega)
            THEN 1 ELSE 0
          END) AS puntuales
    FROM tareas
    GROUP BY colaborador
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al generar el resumen' });

    const resumen = rows.map(row => {
      const total = row.finalizadas || 0;
      const puntual = row.puntuales || 0;
      const porcentaje = total ? (puntual / total) : 0;
      const estrellas = Math.floor(porcentaje * 5);
      const comentario = porcentaje >= 0.6 ? 'Excelente' : 'Necesita mejorar';

      return {
        colaborador: row.colaborador,
        noIniciadas: row.noIniciadas,
        enProceso: row.enProceso,
        finalizadas: total,
        puntuales: puntual,
        estrellas,
        comentario
      };
    });

    res.json(resumen);
  });
});

// ───── Iniciar servidor ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});