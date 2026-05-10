# 🧠 NeuroSight AI

**Advanced MRI-Based Brain Tumor Detection**  
B.Tech Final Year Internship Project | Ensemble of VGG16 & EfficientNetB0

> ⚠️ **Research Prototype Only.** Not a medical device. Not a substitute for professional diagnosis.

---

## 📁 Project Structure

```
neurosight-ai/
├── frontend/          # React + Vite frontend (deploy to Vercel)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── HeroSection.jsx       ← Animated neural network canvas
│   │   │   ├── HowItWorksSection.jsx
│   │   │   ├── DetectionSection.jsx  ← Upload + Result display
│   │   │   ├── AboutSection.jsx      ← Video, stats, model info
│   │   │   ├── FAQSection.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css                ← All styles
│   ├── public/
│   │   └── videos/                   ← ⬅️ Put your video here!
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
└── backend/           # Python Flask API (deploy to Render)
    ├── models/        # ⬅️ Put your .keras model files here!
    │   ├── brain_tumor_detection_vgg16.keras
    │   └── brain_tumor_detection_efficientnetb0.keras
    ├── app.py
    ├── requirements.txt
    ├── render.yaml
    └── .env.example
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd neurosight-ai/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env template and configure
cp .env.example .env
# Edit .env: add MONGODB_URI if you want DB logging

# ⚠️  IMPORTANT: Place your model files:
# models/brain_tumor_detection_vgg16.keras
# models/brain_tumor_detection_efficientnetb0.keras

# Run the Flask server
python app.py
```

The backend starts at: http://localhost:5000  
Test with: http://localhost:5000/health

### 2. Frontend Setup

```bash
cd neurosight-ai/frontend

# Install dependencies
npm install

# Copy env template
cp .env.example .env
# .env already points to http://localhost:5000

# Optional: Add your about video
# Copy your video to: frontend/public/videos/brain-tumor-explainer.mp4

# Run dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🔌 Plugging In Your Models

In `backend/app.py`, the models are loaded from:
```python
vgg_path  = "models/brain_tumor_detection_vgg16.keras"
eff_path  = "models/brain_tumor_detection_efficientnetb0.keras"
```

Just place your `.keras` files in the `backend/models/` folder.  
The app works with **mock predictions** if models are missing (for UI testing).

**Model details from your notebook:**
- Input size: **224 × 224** (RGB, normalized 0–1)
- Classes: `glioma`, `meningioma`, `notumor`, `pituitary`
- Ensemble: `(vgg16_softmax + efficientnetb0_softmax) / 2`

---

## 🎬 Adding Your About Video

Place your video at:
```
frontend/public/videos/brain-tumor-explainer.mp4
```

It will automatically show in the About section. Supported formats: MP4 (recommended), WebM.

---

## ☁️ Deployment

### Deploy Backend to Render

1. Push `backend/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 1`
5. Add environment variables:
   - `MONGODB_URI` = your MongoDB Atlas URI
   - `CORS_ORIGINS` = your Vercel frontend URL

**Note:** Free Render instances sleep after 15 min. The first prediction after sleep takes ~30s.

### Deploy Frontend to Vercel

1. Push `frontend/` folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Set:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g., `https://neurosight-ai-backend.onrender.com`)

---

## 🧬 API Reference

### `GET /health`
Returns server status and model loading state.

### `POST /predict`
- **Content-Type**: `multipart/form-data`
- **Body**: `file` = MRI image (JPG or PNG)

**Response:**
```json
{
  "prediction": "glioma",
  "label": "Glioma",
  "confidence": 0.8231,
  "probabilities": {
    "glioma": 0.8231,
    "meningioma": 0.0512,
    "notumor": 0.0344,
    "pituitary": 0.0913
  },
  "suggestion": "⚠️ The model detects patterns consistent with a Glioma ...",
  "modelVersion": "vgg16+efficientnetb0-ensemble-v1"
}
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, CSS Variables |
| Backend | Python, Flask, Flask-CORS |
| ML Models | TensorFlow/Keras — VGG16 + EfficientNetB0 |
| Database | MongoDB Atlas |
| Deployment | Vercel (frontend), Render (backend) |

---

## 👩‍💻 Developer

**Naina Bhat** — B.Tech Final Year  
[GitHub](https://github.com/nainabhat) · [LinkedIn](https://linkedin.com/in/nainabhat)
