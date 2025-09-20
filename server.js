import express from "express";
import pkg from "pg";
import path from "path";

const { Pool } = pkg;
const app = express();
app.use(express.json());
app.use(express.static(path.join('.', '/')));

const pool = new Pool({
  user: 'fff',
  host: 'dpg-d36qhqe3jp1c73bf2440-a',
  database: 'fff_ntdy',
  password: 'qkn8wKyXSgN2E52kAMRmUn6SjvNOr3g3',
  port: 5432,
});

pool.query(`
CREATE TABLE IF NOT EXISTS xp_log (
  id SERIAL PRIMARY KEY,
  ip TEXT,
  latitude DOUBLE PRECISION NULL,
  longitude DOUBLE PRECISION NULL,
  device TEXT,
  os TEXT,
  browser TEXT,
  visit_time TIMESTAMP NULL,
  xp INT DEFAULT 1,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`).catch(err => console.error("Debug: Create table error:", err));

app.post("/save-location", async (req, res) => {
  const { latitude, longitude, device, os, browser, visitTime } = req.body || {};
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim();

  console.log("Debug: Received payload:", { ip, latitude, longitude, device, os, browser, visitTime });

  try {
    await pool.query(
      `INSERT INTO xp_log (ip, latitude, longitude, device, os, browser, visit_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ip, latitude, longitude, device, os, browser, visitTime]
    );
    res.send(`บันทึกสำเร็จ! IP: ${ip}, Device: ${device}, OS: ${os}, Browser: ${browser}, เวลาเข้าชม: ${visitTime}, XP +1`);
  } catch (err) {
    console.error("Debug: DB Insert error:", err);
    res.status(500).send("บันทึกไม่สำเร็จ: " + err.message);
  }
});

app.get("/xp", async (req, res) => {
  try {
    const result = await pool.query("SELECT SUM(xp) AS total_xp FROM xp_log");
    res.send(`<h1>XP ทั้งหมด: ${result.rows[0].total_xp}</h1><p><a href="/">กลับหน้าแรก</a></p>`);
  } catch (err) {
    console.error("Debug: XP query error:", err);
    res.status(500).send("ไม่สามารถดึงข้อมูลได้");
  }
});

app.get("/history", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM xp_log ORDER BY timestamp DESC");
    let html = `<h1>ประวัติทั้งหมด</h1><table>
      <tr>
        <th>ID</th><th>IP</th><th>Latitude</th><th>Longitude</th>
        <th>Device</th><th>OS</th><th>Browser</th><th>Visit Time</th><th>XP</th><th>Timestamp</th>
      </tr>`;
    result.rows.forEach(row => {
      html += `<tr>
        <td>${row.id}</td>
        <td>${row.ip}</td>
        <td>${row.latitude ?? '-'}</td>
        <td>${row.longitude ?? '-'}</td>
        <td>${row.device ?? '-'}</td>
        <td>${row.os ?? '-'}</td>
        <td>${row.browser ?? '-'}</td>
        <td>${row.visit_time ?? '-'}</td>
        <td>${row.xp}</td>
        <td>${row.timestamp}</td>
      </tr>`;
    });
    html += `</table><p><a href="/">กลับหน้าแรก</a></p>`;
    res.send(html);
  } catch (err) {
    console.error("Debug: History query error:", err);
    res.status(500).send("ไม่สามารถดึงประวัติได้");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
