const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./orders.db");

db.run("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'Pending'", (err) => {
  if (err) {
    console.error("❌ Error altering table:", err.message);
  } else {
    console.log("✅ Status column added successfully!");
  }
  db.close();
});
