"""
scripts/train_model.py
───────────────────────
Train the RandomForest blood demand forecasting model.

Pulls data from blood_request_history, trains the model,
and saves it to ml_models/ for the FastAPI server to load.

Run:
  cd ai_forecast_engine
  python scripts/train_model.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent to path so imports work
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import get_settings
from services.forecast_service import train_model


async def main():
    """Train the model and print results."""
    settings = get_settings()

    print("[*] Connecting to MongoDB...")
    import certifi
    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=30000,
        tlsCAFile=certifi.where(),
    )
    db = client[settings.mongodb_db_name]

    # Verify connection
    await client.admin.command("ping")
    print("[OK] Connected to MongoDB")

    # Check data availability
    count = await db["blood_request_history"].count_documents({})
    print(f"[*] Found {count} historical records")

    if count < 100:
        print("[ERROR] Insufficient data! Run generate_synthetic_data.py first.")
        print("   python scripts/generate_synthetic_data.py")
        client.close()
        return

    # Train the model
    print("\n[*] Training RandomForest model...")
    print("   Features: blood_group, region, month, week_of_year, day_of_week, urgency_count")
    print("   Target: weekly blood demand (units)")
    print()

    try:
        metrics = await train_model(db)

        print(f"\n{'=' * 50}")
        print(f"[OK] MODEL TRAINING COMPLETE")
        print(f"{'=' * 50}")
        print(f"   - Mean Absolute Error (MAE): {metrics['mae']:.2f}")
        print(f"   - R2 Score:                  {metrics['r2']:.3f}")
        print(f"   - Training samples:          {metrics['training_samples']}")
        print(f"   - Test samples:              {metrics['test_samples']}")
        print(f"   - Total records used:        {metrics['total_records']}")
        print(f"   - Trained at:                {metrics['trained_at']}")
        print(f"{'=' * 50}")
        print()

        if metrics['r2'] >= 0.7:
            print("[GOOD] Model quality: GOOD - ready for production use")
        elif metrics['r2'] >= 0.5:
            print("[WARN] Model quality: ACCEPTABLE - consider more training data")
        else:
            print("[FAIL] Model quality: NEEDS IMPROVEMENT - add more data or tune hyperparameters")

        print(f"\n[*] Model saved to: ai_forecast_engine/ml_models/")
        print(f"   - blood_demand_model.joblib")
        print(f"   - label_encoders.joblib")
        print(f"   - model_metrics.joblib")
        print(f"\n[NEXT] Start the server with: python main.py")

    except ValueError as exc:
        print(f"[ERROR] Training failed: {exc}")
    except Exception as exc:
        print(f"[ERROR] Unexpected error: {exc}")
        import traceback
        traceback.print_exc()

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
