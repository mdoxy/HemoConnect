# ML Models Directory

This directory stores trained ML model artifacts.

## Files (generated after training):
- `blood_demand_model.joblib` — Trained RandomForestRegressor
- `label_encoders.joblib` — LabelEncoders for categorical features
- `model_metrics.joblib` — Training metrics (MAE, R², sample counts)

## How to generate:
```bash
cd ai_forecast_engine
python scripts/generate_synthetic_data.py
python scripts/train_model.py
```
