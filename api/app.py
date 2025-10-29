from flask import Flask, jsonify
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
