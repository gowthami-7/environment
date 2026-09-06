import pandas as pd
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

import joblib


# ==========================================
# LOAD DATASET
# ==========================================

dataset_path = "dataset/environment_dataset.csv"

df = pd.read_csv(dataset_path)

print("======================================")
print("RANDOM FOREST MODEL TRAINING")
print("======================================")

print()
print("Dataset shape:", df.shape)


# ==========================================
# INPUT FEATURES
# ==========================================

X = df[
    [
        "distance_cm",
        "temperature_c",
        "humidity_percent",
        "rate_change_cm"
    ]
]


# ==========================================
# TARGET
# ==========================================

y = df["risk"]


# ==========================================
# TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print()
print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# ==========================================
# CREATE RANDOM FOREST
# ==========================================

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    random_state=42
)


# ==========================================
# TRAIN MODEL
# ==========================================

print()
print("Training model...")

model.fit(X_train, y_train)


# ==========================================
# PREDICTION
# ==========================================

y_pred = model.predict(X_test)


# ==========================================
# ACCURACY
# ==========================================

accuracy = accuracy_score(y_test, y_pred)

print()
print("======================================")
print("MODEL RESULTS")
print("======================================")

print()
print("Accuracy:", round(accuracy * 100, 2), "%")


# ==========================================
# CLASSIFICATION REPORT
# ==========================================

print()
print("Classification Report:")
print(classification_report(y_test, y_pred))


# ==========================================
# CONFUSION MATRIX
# ==========================================

print()
print("Confusion Matrix:")

print(confusion_matrix(
    y_test,
    y_pred,
    labels=["NORMAL", "WARNING", "CRITICAL"]
))


# ==========================================
# FEATURE IMPORTANCE
# ==========================================

print()
print("Feature Importance:")

for feature, importance in zip(
    X.columns,
    model.feature_importances_
):
    print(
        feature,
        ":",
        round(importance, 4)
    )


# ==========================================
# SAVE MODEL
# ==========================================

os.makedirs("model", exist_ok=True)

model_path = "model/environment_risk_model.pkl"

joblib.dump(model, model_path)


print()
print("======================================")
print("MODEL SAVED")
print("======================================")

print()
print("Saved to:")
print(model_path)

print()
print("DONE")