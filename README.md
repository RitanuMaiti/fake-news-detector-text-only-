# Fake News Detector (Text-Only)

Full-stack ML app that predicts whether a news article is **Real** or **Fake** using NLP, FastAPI, React, and MongoDB.

> **Note:** This detector analyzes **plain text only** (headlines or full-body articles). It does not process images, videos, audio, or external URLs.

---

## Tech Stack

- **Frontend:** React.js
- **Backend:** FastAPI, Uvicorn
- **Machine Learning:** scikit-learn (`LinearSVC` + `TfidfVectorizer`)
- **Database:** MongoDB Atlas

---

## Folder Structure

```text
fake-news-detector/
├── backend/
│   ├── server.py              # FastAPI endpoints
│   ├── fake_news_pipeline.pkl # Trained ML model
│   ├── requirements.txt       # Python packages
│   └── env.env                # Local secrets (ignored by Git)
├── frontend/                  # React UI source code
└── README.md
