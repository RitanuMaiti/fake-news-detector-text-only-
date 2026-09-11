import os
import uuid
import joblib

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "fake_news_detector")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Initialize application
app = FastAPI(title="Fake News Detector API")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Load Machine Learning Model
# --------------------------------------------------
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "models",
    "fake_news_pipeline.pkl"
)

try:
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    model = None
    print(f"Warning: Could not load model from {MODEL_PATH}: {e}")

# --------------------------------------------------
# MongoDB Connection
# --------------------------------------------------
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# --------------------------------------------------
# Request Schema
# --------------------------------------------------
class NewsRequest(BaseModel):
    text: str

# --------------------------------------------------
# Endpoints
# --------------------------------------------------
@app.get("/api/")
async def root():
    return {"message": "Fake News Detector API"}

@app.post("/api/analyze")
async def analyze_news(payload: NewsRequest):
    if model is None:
        raise HTTPException(
            status_code=500,
            detail="ML model is not loaded."
        )

    clean_text = payload.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    try:
        # Mapping: 0 = FAKE, 1 = REAL
        prediction = int(model.predict([clean_text])[0])

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba([clean_text])[0]
            confidence = float(max(probabilities))
            
            # Index 1 = REAL probability (Truth Score)
            prob_real = float(probabilities[1])
            truth_score = round(prob_real * 100, 2)
        else:
            confidence = 1.0
            truth_score = 100.0 if prediction == 1 else 0.0

        label = "REAL" if prediction == 1 else "FAKE"

        result = {
            "id": str(uuid.uuid4()),
            "text": clean_text,
            "verdict": label,
            "truth_score": truth_score,
            "note": (
                f"Model predicts this news is {label} with "
                f"{round(confidence * 100, 2)}% confidence."
            )
        }

        # Insert record into MongoDB
        await db.history.insert_one(result.copy())

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )