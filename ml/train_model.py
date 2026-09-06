import pandas as pd
import numpy as np
import os

# ==========================================
# CREATE FOLDER
# ==========================================

os.makedirs("dataset", exist_ok=True)

# ==========================================
# RANDOM DATA GENERATION
# ==========================================

np.random.seed(42)

rows = 3000

data = []

for _ in range(rows):

    # Ultrasonic distance from sensor to water surface
    distance = np.random.uniform(250, 420)

    # Temperature from DHT22
    temperature = np.random.uniform(20, 40)

    # Humidity from DHT22
    humidity = np.random.uniform(40, 95)

    # Simulated rate of distance change
    rate_change = np.random.uniform(-20, 10)

    # ==========================================
    # LABEL CREATION
    # ==========================================

    # CRITICAL:
    # Very low distance OR very rapid decrease
    if distance < 280 or rate_change < -15:
        risk = "CRITICAL"

    # WARNING:
    # Moderate low distance OR moderate decrease
    elif distance < 330 or rate_change < -7:
        risk = "WARNING"

    # NORMAL
    else:
        risk = "NORMAL"

    data.append([
        distance,
        temperature,
        humidity,
        rate_change,
        risk
    ])


# ==========================================
# CREATE DATAFRAME
# ==========================================

df = pd.DataFrame(
    data,
    columns=[
        "distance_cm",
        "temperature_c",
        "humidity_percent",
        "rate_change_cm",
        "risk"
    ]
)


# ==========================================
# SAVE DATASET
# ==========================================

file_path = "dataset/environment_dataset.csv"

df.to_csv(
    file_path,
    index=False
)


# ==========================================
# DISPLAY INFORMATION
# ==========================================

print("======================================")
print("ENVIRONMENT DATASET CREATED")
print("======================================")

print()

print("Rows:", len(df))

print()

print("Columns:")
print(df.columns.tolist())

print()

print("Risk distribution:")
print(df["risk"].value_counts())

print()

print("First 10 rows:")
print(df.head(10))

print()

print("Dataset saved to:")
print(file_path)

print()

print("======================================")
print("DONE")
print("======================================")