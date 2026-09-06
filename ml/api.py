from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

from database import (
    add_node,
    get_nodes,
    save_sensor_reading,
    save_prediction,
    save_alert,
    get_recent_readings,
    get_recent_predictions,
    get_alerts,
    acknowledge_alert,
)

# ==================================================
# FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="Environmental Monitoring API",
    description="AI-powered environmental risk monitoring backend",
    version="1.0"
)

# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# LOAD RANDOM FOREST MODEL
# ==================================================

MODEL_PATH = "model/environment_risk_model.pkl"

model = joblib.load(MODEL_PATH)

print("Random Forest model loaded successfully.")


# ==================================================
# SENSOR DATA MODEL
# ==================================================

class SensorData(BaseModel):
    distance_cm: float
    temperature_c: float
    humidity_percent: float
    rate_change_cm: float
    node_id: str = "NODE-01"


# ==================================================
# HOME ENDPOINT
# ==================================================

@app.get("/")
def root():

    return {
        "status": "online",
        "service": "Environmental Monitoring API",
        "model": "Random Forest"
    }


# ==================================================
# AI PREDICTION ENDPOINT
# ==================================================

@app.post("/predict")
def predict(data: SensorData):

    # ----------------------------------------------
    # Prepare features
    # ----------------------------------------------

    features = pd.DataFrame([
        {
            "distance_cm": data.distance_cm,
            "temperature_c": data.temperature_c,
            "humidity_percent": data.humidity_percent,
            "rate_change_cm": data.rate_change_cm
        }
    ])

    # ----------------------------------------------
    # Random Forest prediction
    # ----------------------------------------------

    prediction = model.predict(features)[0]

    # ----------------------------------------------
    # Model confidence
    # ----------------------------------------------

    probabilities = model.predict_proba(features)[0]

    confidence = round(
        float(max(probabilities) * 100),
        2
    )

    risk = str(prediction).upper()

    # ----------------------------------------------
    # Ensure node exists
    # ----------------------------------------------

    add_node(
        node_id=data.node_id,
        location="Central Monitoring Zone",
        latitude=13.0827,
        longitude=80.2707,
        status="ONLINE"
    )

    # ----------------------------------------------
    # Save sensor reading
    # ----------------------------------------------

    save_sensor_reading(
        node_id=data.node_id,
        distance_cm=data.distance_cm,
        temperature_c=data.temperature_c,
        humidity_percent=data.humidity_percent,
        rate_change_cm=data.rate_change_cm
    )

    # ----------------------------------------------
    # Save AI prediction
    # ----------------------------------------------

    save_prediction(
        node_id=data.node_id,
        risk=risk,
        confidence=confidence
    )

    # ----------------------------------------------
    # Generate alert
    # ----------------------------------------------

    alert_message = None

    if risk == "WARNING":

        alert_message = (
            "Warning: environmental conditions "
            "indicate an increasing risk level."
        )

        save_alert(
            node_id=data.node_id,
            risk=risk,
            message=alert_message
        )

    elif risk == "CRITICAL":

        alert_message = (
            "Critical alert: environmental conditions "
            "indicate a high-risk situation."
        )

        save_alert(
            node_id=data.node_id,
            risk=risk,
            message=alert_message
        )

    # ----------------------------------------------
    # Return result
    # ----------------------------------------------

    return {

        "risk": risk,

        "confidence": confidence,

        "sensor_data": {
            "distance_cm":
                data.distance_cm,

            "temperature_c":
                data.temperature_c,

            "humidity_percent":
                data.humidity_percent,

            "rate_change_cm":
                data.rate_change_cm
        },

        "node_id":
            data.node_id,

        "alert": {

            "active":
                risk in [
                    "WARNING",
                    "CRITICAL"
                ],

            "message":
                alert_message
        }
    }


# ==================================================
# DATABASE API ENDPOINTS
# ==================================================


# ==================================================
# GET ALL MONITORING NODES
# ==================================================

@app.get("/nodes")
def get_all_nodes():

    data = get_nodes()

    return {
        "count": len(data),
        "nodes": data
    }


# ==================================================
# GET SENSOR READINGS
# ==================================================

@app.get("/readings/{node_id}")
def readings(
    node_id: str,
    limit: int = 20
):

    data = get_recent_readings(
        node_id=node_id,
        limit=limit
    )

    return {
        "node_id": node_id,
        "count": len(data),
        "readings": data
    }


# ==================================================
# GET AI PREDICTIONS
# ==================================================

@app.get("/predictions/{node_id}")
def predictions(
    node_id: str,
    limit: int = 20
):

    data = get_recent_predictions(
        node_id=node_id,
        limit=limit
    )

    return {
        "node_id": node_id,
        "count": len(data),
        "predictions": data
    }


# ==================================================
# GET ALERTS
# ==================================================

@app.get("/alerts")
def alerts(
    limit: int = 20
):

    data = get_alerts(
        limit=limit
    )

    return {
        "count": len(data),
        "alerts": data
    }


# ==================================================
# ACKNOWLEDGE ALERT
# ==================================================

@app.put("/alerts/{alert_id}/acknowledge")
def acknowledge(
    alert_id: int
):

    acknowledge_alert(
        alert_id
    )

    return {
        "success": True,
        "alert_id": alert_id,
        "message":
            "Alert acknowledged successfully."
    }