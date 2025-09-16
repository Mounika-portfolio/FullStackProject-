const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));
app.use(express.json()); // parse JSON body

// connect DB
const db = new sqlite3.Database("./orders.db", (err) => {
  if (err) console.error("❌ DB Connection Error:", err.message);
  else console.log("✅ Connected to SQLite");
});

// create table
db.run(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item TEXT,
  time TEXT,
  status TEXT DEFAULT 'Pending'
)`);

// ---------------- REST API ----------------

// CREATE (POST /api/orders)
app.post("/api/orders", (req, res) => {
  const { item, time } = req.body;
  if (!item || !time) {
    return res.status(400).json({ error: "Item and time required" });
  }
  db.run(
    "INSERT INTO orders (item, time) VALUES (?, ?)",
    [item, time],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const newOrder = { id: this.lastID, item, time, status: "Pending" };
      io.emit("newOrder", newOrder); // notify waiter in realtime
      res.status(201).json(newOrder);
    }
  );
});

// READ ALL (GET /api/orders)
app.get("/api/orders", (req, res) => {
  db.all("SELECT * FROM orders ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// READ ONE (GET /api/orders/:id)
app.get("/api/orders/:id", (req, res) => {
  db.get("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Order not found" });
    res.json(row);
  });
});

// UPDATE (PUT /api/orders/:id)
app.put("/api/orders/:id", (req, res) => {
  const { status } = req.body;
  db.run(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Order not found" });
      res.json({ message: "Order updated", id: req.params.id, status });
    }
  );
});

// DELETE (DELETE /api/orders/:id)
app.delete("/api/orders/:id", (req, res) => {
  db.run("DELETE FROM orders WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted", id: req.params.id });
  });
});

// -------------------------------------------

// Socket.IO (realtime orders)
io.on("connection", (socket) => {
  console.log("✅ User connected");

  socket.on("newOrder", (order) => {
    db.run(
      "INSERT INTO orders (item, time) VALUES (?, ?)",
      [order.item, order.time],
      function (err) {
        if (!err) {
          const savedOrder = { id: this.lastID, ...order, status: "Pending" };
          io.emit("newOrder", savedOrder);
        }
      }
    );
  });

  socket.on("disconnect", () => console.log("❌ User disconnected"));
});

// routes for pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "Index.html")));
app.get("/waiter", (req, res) =>
  res.sendFile(path.join(__dirname, "waiter.html"))
);

// start server
const PORT = 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
