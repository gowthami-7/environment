import sqlite3
from datetime import datetime

DB_NAME = "environment_monitoring.db"


# =====================================================
# DATABASE CONNECTION
# =====================================================

def get_connection():
    """Create and return a database connection."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# =====================================================
# INITIALIZE DATABASE
# =====================================================

def initialize_database():
    """Create all required database tables."""

    conn = get_connection()
    cursor = conn.cursor()

    # -------------------------------------------------
    # Monitoring Nodes
    # -------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            location TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            status TEXT DEFAULT 'ONLINE'
        )
    """)

    # -------------------------------------------------
    # Sensor Readings
    # -------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            distance_cm REAL,
            temperature_c REAL,
            humidity_percent REAL,
            rate_change_cm REAL,
            FOREIGN KEY (node_id) REFERENCES nodes(id)
        )
    """)

    # -------------------------------------------------
    # AI Predictions
    # -------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            risk TEXT NOT NULL,
            confidence REAL,
            FOREIGN KEY (node_id) REFERENCES nodes(id)
        )
    """)

    # -------------------------------------------------
    # Alerts
    # -------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            risk TEXT NOT NULL,
            message TEXT,
            acknowledged INTEGER DEFAULT 0,
            FOREIGN KEY (node_id) REFERENCES nodes(id)
        )
    """)

    conn.commit()
    conn.close()


# =====================================================
# NODE FUNCTIONS
# =====================================================

def add_node(
    node_id,
    location,
    latitude,
    longitude,
    status="ONLINE"
):
    """Add or update a monitoring node."""

    conn = get_connection()

    conn.execute("""
        INSERT OR REPLACE INTO nodes
        (
            id,
            location,
            latitude,
            longitude,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        node_id,
        location,
        latitude,
        longitude,
        status
    ))

    conn.commit()
    conn.close()


def get_nodes():
    """Return all monitoring nodes."""

    conn = get_connection()

    rows = conn.execute("""
        SELECT
            id,
            location,
            latitude,
            longitude,
            status
        FROM nodes
        ORDER BY id
    """).fetchall()

    conn.close()

    return [dict(row) for row in rows]


def get_node(node_id):
    """Return one monitoring node."""

    conn = get_connection()

    row = conn.execute("""
        SELECT
            id,
            location,
            latitude,
            longitude,
            status
        FROM nodes
        WHERE id = ?
    """, (node_id,)).fetchone()

    conn.close()

    if row is None:
        return None

    return dict(row)


# =====================================================
# SENSOR READING FUNCTIONS
# =====================================================

def save_sensor_reading(
    node_id,
    distance_cm,
    temperature_c,
    humidity_percent,
    rate_change_cm
):
    """Save sensor data."""

    conn = get_connection()

    timestamp = datetime.now().isoformat()

    conn.execute("""
        INSERT INTO sensor_readings
        (
            node_id,
            timestamp,
            distance_cm,
            temperature_c,
            humidity_percent,
            rate_change_cm
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        node_id,
        timestamp,
        distance_cm,
        temperature_c,
        humidity_percent,
        rate_change_cm
    ))

    conn.commit()
    conn.close()


def get_recent_readings(
    node_id,
    limit=20
):
    """Get recent sensor readings."""

    conn = get_connection()

    rows = conn.execute("""
        SELECT *
        FROM sensor_readings
        WHERE node_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    """, (
        node_id,
        limit
    )).fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]


# =====================================================
# PREDICTION FUNCTIONS
# =====================================================

def save_prediction(
    node_id,
    risk,
    confidence
):
    """Save AI prediction."""

    conn = get_connection()

    timestamp = datetime.now().isoformat()

    conn.execute("""
        INSERT INTO predictions
        (
            node_id,
            timestamp,
            risk,
            confidence
        )
        VALUES (?, ?, ?, ?)
    """, (
        node_id,
        timestamp,
        risk,
        confidence
    ))

    conn.commit()
    conn.close()


def get_recent_predictions(
    node_id,
    limit=20
):
    """Get recent AI predictions."""

    conn = get_connection()

    rows = conn.execute("""
        SELECT *
        FROM predictions
        WHERE node_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    """, (
        node_id,
        limit
    )).fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]


# =====================================================
# ALERT FUNCTIONS
# =====================================================

def save_alert(
    node_id,
    risk,
    message
):
    """Save a new alert."""

    conn = get_connection()

    timestamp = datetime.now().isoformat()

    conn.execute("""
        INSERT INTO alerts
        (
            node_id,
            timestamp,
            risk,
            message,
            acknowledged
        )
        VALUES (?, ?, ?, ?, 0)
    """, (
        node_id,
        timestamp,
        risk,
        message
    ))

    conn.commit()
    conn.close()


def get_alerts(limit=20):
    """Get recent alerts."""

    conn = get_connection()

    rows = conn.execute("""
        SELECT *
        FROM alerts
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,)).fetchall()

    conn.close()

    return [
        dict(row)
        for row in rows
    ]


def acknowledge_alert(alert_id):
    """Mark an alert as acknowledged."""

    conn = get_connection()

    conn.execute("""
        UPDATE alerts
        SET acknowledged = 1
        WHERE id = ?
    """, (alert_id,))

    conn.commit()
    conn.close()


# =====================================================
# INITIALIZE DATABASE ON STARTUP
# =====================================================

initialize_database()