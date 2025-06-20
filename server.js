const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); 

const app = express();
const port = 3000;

// --- System State ---
let systemStatus = 'on';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database ---
const pool = new Pool({
  user: 'postgres',           
  host: 'localhost',          
  database: 'Yarkom',         
  password: 'LeBron', 
  port: 5432,                 
});

// --- API Endpoints ---

app.post('/api/data', async (req, res) => {
  if (systemStatus === 'off') {
    return res.status(200).send({ message: 'System is off. Data not saved.', status: 'off' });
  }

  const { distance, led_state } = req.body;

  // Basic validation
  if (typeof distance === 'undefined' || typeof led_state === 'undefined') {
    return res.status(400).send({ error: 'Missing distance or led_state' });
  }

  console.log(`Received data: Distance = ${distance} cm, LED State = ${led_state}`);

  const ledIsOn = led_state === 1;
  const insertQuery = 'INSERT INTO sensor_data(distance_cm, led_is_on) VALUES($1, $2)';

  try {
    await pool.query(insertQuery, [distance, ledIsOn]);
    res.status(201).send({ message: 'Data saved successfully', status: systemStatus });
  } catch (err) {
    console.error('Error inserting data into database:', err);
    res.status(500).send({ error: 'Database error' });
  }
});

// ESP32 endpoint for status check
app.get('/api/status', (req, res) => {
  console.log(`Status check from device: Status is ${systemStatus}`);
  res.status(200).send({ status: systemStatus });
});

// FE End point consys
app.post('/api/control', (req, res) => {
  const { newStatus } = req.body;

  if (newStatus === 'on' || newStatus === 'off') {
    systemStatus = newStatus;
    console.log(`System status changed to: ${systemStatus}`);
    res.status(200).send({ message: `System is now ${systemStatus}`, status: systemStatus });
  } else {
    res.status(400).send({ error: 'Invalid status. Must be "on" or "off".' });
  }
});

app.get('/api/sensor-data', async (req, res) => {
  try {
    const sensorQuery = `
      SELECT * FROM (
        SELECT * FROM sensor_data 
        ORDER BY created_at DESC 
        LIMIT 100
      ) sub 
      ORDER BY created_at ASC;
    `;
    
    const { rows } = await pool.query(sensorQuery);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching sensor data:', err);
    res.status(500).send({ error: 'Database error' });
  }
});
// --- Server Start ---
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${port}`);
  console.log(`System is initially: ${systemStatus}`);
});
