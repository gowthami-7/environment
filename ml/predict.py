import pandas as pd
import joblib


# ==========================================
# LOAD TRAINED MODEL
# ==========================================

model_path = "model/environment_risk_model.pkl"

model = joblib.load(model_path)


# ==========================================
# TEST SENSOR READINGS
# ==========================================

test_readings = pd.DataFrame([
    {
        "distance_cm": 380,
        "temperature_c": 29,
        "humidity_percent": 65,
        "rate_change_cm": 2
    },
    {
        "distance_cm": 310,
        "temperature_c": 30,
        "humidity_percent": 70,
        "rate_change_cm": -10
    },
    {
        "distance_cm": 260,
        "temperature_c": 31,
        "humidity_percent": 80,
        "rate_change_cm": -18
    }
])


# ==========================================
# PREDICTION
# ==========================================

predictions = model.predict(test_readings)

probabilities = model.predict_proba(test_readings)


# ==========================================
# DISPLAY RESULTS
# ==========================================

print("======================================")
print("ENVIRONMENT RISK PREDICTION")
print("======================================")

for i in range(len(test_readings)):

    print()
    print("Test Reading", i + 1)

    print(
        "Distance:",
        test_readings.iloc[i]["distance_cm"],
        "cm"
    )

    print(
        "Temperature:",
        test_readings.iloc[i]["temperature_c"],
        "°C"
    )

    print(
        "Humidity:",
        test_readings.iloc[i]["humidity_percent"],
        "%"
    )

    print(
        "Rate of change:",
        test_readings.iloc[i]["rate_change_cm"],
        "cm"
    )

    print(
        "Predicted Risk:",
        predictions[i]
    )

    confidence = max(probabilities[i]) * 100

    print(
        "Model Confidence:",
        round(confidence, 2),
        "%"
    )


print()
print("======================================")
print("PREDICTION TEST COMPLETE")
print("======================================")