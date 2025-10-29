from flask import Flask, jsonify
from flask import render_template_string, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'esp32_sensors'),
    'user': os.getenv('DB_USER', 'postgres'),
    'port': os.getenv('DB_PORT', '5432')
}

# Only add password if it exists
if os.getenv('DB_PASSWORD'):
    DB_CONFIG['password'] = os.getenv('DB_PASSWORD')

def get_db_connection():
    """Create a database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"[v0] Database connection error: {e}")
        return None

@app.route('/api/devices', methods=['GET'])
def get_devices():
    """Get list of unique devices"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT device_id FROM lecturas ORDER BY device_id")
        devices = [row['device_id'] for row in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({'devices': devices})
    except Exception as e:
        print(f"[v0] Error fetching devices: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/latest/<device_id>', methods=['GET'])
def get_latest_reading(device_id):
    """Get the latest reading for a specific device"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT device_id, temperatura, humedad, distancia_cm, 
                   luz_porcentaje, estado_luz, timestamp_lectura
            FROM lecturas
            WHERE device_id = %s
            ORDER BY timestamp_lectura DESC
            LIMIT 1
        """, (device_id,))
        reading = cur.fetchone()
        cur.close()
        conn.close()
        
        if reading:
            # Convert timestamp to ISO format
            reading['timestamp_lectura'] = reading['timestamp_lectura'].isoformat()
            return jsonify(reading)
        else:
            return jsonify({'error': 'No data found'}), 404
    except Exception as e:
        print(f"[v0] Error fetching latest reading: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/history/<device_id>', methods=['GET'])
def get_history(device_id):
    """Get historical data for a specific device (last 24 hours)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        # Get last 50 readings for the device
        cur.execute("""
            SELECT device_id, temperatura, humedad, distancia_cm, 
                   luz_porcentaje, estado_luz, timestamp_lectura
            FROM lecturas
            WHERE device_id = %s
            ORDER BY timestamp_lectura DESC
            LIMIT 50
        """, (device_id,))
        readings = cur.fetchall()
        cur.close()
        conn.close()
        
        # Convert timestamps and reverse order (oldest first for charts)
        for reading in readings:
            reading['timestamp_lectura'] = reading['timestamp_lectura'].isoformat()
        
        return jsonify({'readings': list(reversed(readings))})
    except Exception as e:
        print(f"[v0] Error fetching history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats/<device_id>', methods=['GET'])
def get_stats(device_id):
    """Get statistics for a specific device"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                AVG(temperatura) as avg_temp,
                MIN(temperatura) as min_temp,
                MAX(temperatura) as max_temp,
                AVG(humedad) as avg_humidity,
                MIN(humedad) as min_humidity,
                MAX(humedad) as max_humidity,
                AVG(distancia_cm) as avg_distance,
                MIN(distancia_cm) as min_distance,
                MAX(distancia_cm) as max_distance,
                COUNT(*) as total_readings
            FROM lecturas
            WHERE device_id = %s
        """, (device_id,))
        stats = cur.fetchone()
        cur.close()
        conn.close()
        
        return jsonify(stats)
    except Exception as e:
        print(f"[v0] Error fetching stats: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/sensores', methods=['GET'])
def sensores_latest():
        """Return the most recent reading for each device (JSON)
        Matches requirement: /sensores shows datos más recientes de cada ESP32
        """
        conn = get_db_connection()
        if not conn:
                return jsonify({'error': 'Database connection failed'}), 500

        try:
                cur = conn.cursor()
                # Use DISTINCT ON to get latest per device (Postgres)
                cur.execute("""
                        SELECT DISTINCT ON (device_id) device_id, temperatura, humedad, distancia_cm,
                                     luz_porcentaje, estado_luz, timestamp_lectura
                        FROM lecturas
                        ORDER BY device_id, timestamp_lectura DESC
                """)
                rows = cur.fetchall()
                cur.close()
                conn.close()

                for r in rows:
                        if isinstance(r.get('timestamp_lectura'), datetime):
                                r['timestamp_lectura'] = r['timestamp_lectura'].isoformat()

                return jsonify({'devices': rows})
        except Exception as e:
                print(f"[v0] Error fetching sensores latest: {e}")
                return jsonify({'error': str(e)}), 500


@app.route('/historico/<device_id>', methods=['GET'])
def historico(device_id):
        """Return historical records for device_id (JSON). Query param `limit` optional."""
        limit = 200
        try:
                limit = int(request.args.get('limit', limit))
        except Exception:
                pass

        conn = get_db_connection()
        if not conn:
                return jsonify({'error': 'Database connection failed'}), 500

        try:
                cur = conn.cursor()
                cur.execute("""
                        SELECT device_id, temperatura, humedad, distancia_cm, luz_porcentaje, estado_luz, consumo_w, timestamp_lectura
                        FROM lecturas
                        WHERE device_id = %s
                        ORDER BY timestamp_lectura DESC
                        LIMIT %s
                """, (device_id, limit))
                readings = cur.fetchall()
                cur.close()
                conn.close()

                for reading in readings:
                        if isinstance(reading.get('timestamp_lectura'), datetime):
                                reading['timestamp_lectura'] = reading['timestamp_lectura'].isoformat()

                return jsonify({'readings': readings})
        except Exception as e:
                print(f"[v0] Error fetching historico: {e}")
                return jsonify({'error': str(e)}), 500


@app.route('/grafica/<device_id>', methods=['GET'])
def grafica(device_id):
        """Generate an HTML page with Chart.js plots for temperatura, humedad and consumo.
        This returns a simple page that embeds Chart.js (CDN) and renders the last N readings.
        """
        limit = int(request.args.get('limit', 100))
        conn = get_db_connection()
        if not conn:
                return "Database connection failed", 500

        try:
                cur = conn.cursor()
                cur.execute("""
                        SELECT timestamp_lectura, temperatura, humedad, consumo_w
                        FROM lecturas
                        WHERE device_id = %s
                        ORDER BY timestamp_lectura DESC
                        LIMIT %s
                """, (device_id, limit))
                rows = cur.fetchall()
                cur.close()
                conn.close()

                # Prepare arrays (oldest first)
                rows = list(reversed(rows))
                labels = [r['timestamp_lectura'].isoformat() if isinstance(r.get('timestamp_lectura'), datetime) else r.get('timestamp_lectura') for r in rows]
                temperatura = [float(r['temperatura']) if r.get('temperatura') is not None else None for r in rows]
                humedad = [float(r['humedad']) if r.get('humedad') is not None else None for r in rows]
                consumo = [float(r['consumo_w']) if r.get('consumo_w') is not None else None for r in rows]

                html = render_template_string("""
                <!doctype html>
                <html>
                    <head>
                        <meta charset="utf-8" />
                        <title>Grafica {{device_id}}</title>
                        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                        <style>body { font-family: system-ui, sans-serif; padding: 20px; }</style>
                    </head>
                    <body>
                        <h2>Dispositivo: {{device_id}}</h2>
                        <canvas id="chart" width="900" height="300"></canvas>
                        <script>
                            const labels = {{ labels|tojson }};
                            const temp = {{ temperatura|tojson }};
                            const hum = {{ humedad|tojson }};
                            const cons = {{ consumo|tojson }};

                            const ctx = document.getElementById('chart').getContext('2d');
                            const chart = new Chart(ctx, {
                                type: 'line',
                                data: {
                                    labels: labels,
                                    datasets: [
                                        { label: 'Temperatura (°C)', data: temp, borderColor: 'rgb(255,99,132)', tension: 0.2 },
                                        { label: 'Humedad (%)', data: hum, borderColor: 'rgb(54,162,235)', tension: 0.2 },
                                        { label: 'Consumo (W)', data: cons, borderColor: 'rgb(255,205,86)', tension: 0.2, yAxisID: 'y1' },
                                    ]
                                },
                                options: {
                                    interaction: { mode: 'index', intersect: false },
                                    scales: {
                                        y: { type: 'linear', position: 'left' },
                                        y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
                                    }
                                }
                            });
                        </script>
                    </body>
                </html>
                """, device_id=device_id, labels=labels, temperatura=temperatura, humedad=humedad, consumo=consumo)

                return html
        except Exception as e:
                print(f"[v0] Error building grafica: {e}")
                return f"Error: {e}", 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
