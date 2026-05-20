
import os
import io
import logging
import numpy as np
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": os.getenv("CORS_ORIGINS", "*")}})

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]
CLASS_LABELS = {
    "glioma":     "Glioma",
    "meningioma": "Meningioma",
    "notumor":    "No Tumor",
    "pituitary":  "Pituitary Tumor",
}

# CRITICAL: Each model has different input sizes!
VGG16_IMG_SIZE = (64, 64)
EFFICIENTNET_IMG_SIZE = (224, 224)

MODEL_VERSION = "vgg16+efficientnetb0-ensemble-v1"

# ─────────────────────────────────────────────
# Suggestion templates
# ─────────────────────────────────────────────
SUGGESTIONS = {
    "glioma": (
        "⚠️ The model detects patterns consistent with a Glioma — a type of tumor "
        "arising from glial cells. Gliomas can range from slow-growing (grade I–II) "
        "to aggressive (grade III–IV). Please consult a neuro-oncologist urgently and "
        "confirm findings with a certified radiologist. An MRI with contrast and "
        "possibly a biopsy may be recommended. This is NOT a medical diagnosis."
    ),
    "meningioma": (
        "⚠️ The model detects patterns consistent with a Meningioma — a tumor that "
        "forms on the membranes surrounding the brain and spinal cord. Most meningiomas "
        "are benign and slow-growing. Please consult a neurosurgeon or neurologist for "
        "a confirmed diagnosis. A contrast MRI and clinical evaluation are recommended. "
        "This is NOT a medical diagnosis."
    ),
    "notumor": (
        "✅ No tumor pattern was detected by the model in this MRI scan. "
        "However, this tool is a research prototype and cannot replace a professional "
        "radiological review. Always consult a qualified medical professional for any "
        "neurological concerns or symptoms."
    ),
    "pituitary": (
        "⚠️ The model detects patterns consistent with a Pituitary Tumor — a growth "
        "in the pituitary gland at the base of the brain. Most pituitary tumors are "
        "non-cancerous adenomas but can affect hormonal balance. Please consult an "
        "endocrinologist or neurosurgeon and confirm with an MRI with contrast. "
        "This is NOT a medical diagnosis."
    ),
}

# ─────────────────────────────────────────────
# Load models at startup
# ─────────────────────────────────────────────
model_vgg = None
model_effnet = None

def load_models():
    global model_vgg, model_effnet
    try:
        import tensorflow as tf
        
        # VGG16 - Load from .keras file
        vgg_path = os.getenv("VGG16_MODEL_PATH", "models/brain_tumor_detection_vgg16.keras")
        
        if os.path.exists(vgg_path):
            logger.info(f"Loading VGG16 from {vgg_path}...")
            try:
                model_vgg = tf.keras.models.load_model(vgg_path)
                logger.info("✅ VGG16 loaded (64x64 input, /255.0 norm)")
            except Exception as e:
                logger.error(f"Failed to load VGG16: {e}")
                model_vgg = None
        else:
            logger.error(f"❌ VGG16 file NOT found: {vgg_path}")
            logger.error(f"   Directory contents: {os.listdir('models') if os.path.exists('models') else 'models/ does not exist'}")
            model_vgg = None

        # EfficientNetB0 - Load from FOLDER (saved_model format)
        effnet_path = os.getenv("EFFNET_MODEL_PATH", "models/brain_tumor_detection_efficientnetb0")
        
        if os.path.exists(effnet_path):
            logger.info(f"Loading EfficientNetB0 from {effnet_path}...")
            try:
                # For folder-based models, tf.keras.models.load_model() handles it
                model_effnet = tf.keras.models.load_model(effnet_path)
                logger.info("✅ EfficientNetB0 loaded (224x224 input, preprocess_input)")
            except Exception as e:
                logger.error(f"Failed to load EfficientNetB0: {e}")
                model_effnet = None
        else:
            logger.error(f"❌ EfficientNetB0 folder NOT found: {effnet_path}")
            logger.error(f"   Directory contents: {os.listdir('models') if os.path.exists('models') else 'models/ does not exist'}")
            model_effnet = None
            
        # Log summary
        logger.info(f"Model Status:")
        logger.info(f"  VGG16: {'🟢 LOADED' if model_vgg else '🔴 FAILED'}")
        logger.info(f"  EfficientNetB0: {'🟢 LOADED' if model_effnet else '🔴 FAILED'}")

    except Exception as e:
        logger.error(f"Critical error in load_models(): {e}")
        import traceback
        logger.error(traceback.format_exc())

# ─────────────────────────────────────────────
# Image preprocessing - DIFFERENT for each model
# ─────────────────────────────────────────────

def preprocess_image_for_vgg16(image_bytes):
    """
    Preprocess image for VGG16 (expects 64x64, simple / 255.0).
    This matches the training preprocessing exactly.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(VGG16_IMG_SIZE, Image.LANCZOS)
    img_array = np.array(img, dtype=np.float32) / 255.0  # Simple normalization
    img_array = np.expand_dims(img_array, axis=0)  # (1, 64, 64, 3)
    return img_array

def preprocess_image_for_efficientnet(image_bytes):
    """
    Preprocess image for EfficientNetB0 (expects 224x224, preprocess_input).
    CRITICAL: Must use tensorflow.keras.applications.efficientnet.preprocess_input
    to match training preprocessing!
    """
    try:
        from tensorflow.keras.applications.efficientnet import preprocess_input
    except ImportError:
        logger.error("Could not import preprocess_input from efficientnet!")
        # Fallback to simple normalization if import fails
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(EFFICIENTNET_IMG_SIZE, Image.LANCZOS)
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(EFFICIENTNET_IMG_SIZE, Image.LANCZOS)
    img_array = np.array(img, dtype=np.float32)  # Keep original scale
    img_array = np.expand_dims(img_array, axis=0)  # (1, 224, 224, 3)
    img_array = preprocess_input(img_array)  # ← CRITICAL: Use preprocess_input!
    return img_array

def mock_predict():
    """Return plausible random probabilities when models are not loaded."""
    probs = np.random.dirichlet(np.ones(4)).tolist()
    return probs

def run_ensemble(image_bytes):
    """
    Run both models with their CORRECT preprocessing and average predictions.
    
    CRITICAL: Each model gets its correctly-preprocessed input!
    - VGG16 with 64x64 and / 255.0
    - EfficientNetB0 with 224x224 and preprocess_input()
    """
    probs_list = []
    
    # VGG16 with 64x64 input and simple normalization
    if model_vgg is not None:
        try:
            img_array_vgg = preprocess_image_for_vgg16(image_bytes)
            p1 = model_vgg.predict(img_array_vgg, verbose=0)
            probs_list.append(p1[0])
            logger.info(f"✅ VGG16 prediction: {p1[0]}")
        except Exception as e:
            logger.warning(f"VGG16 prediction failed: {e}")
    
    # EfficientNetB0 with 224x224 input and preprocess_input normalization
    if model_effnet is not None:
        try:
            img_array_eff = preprocess_image_for_efficientnet(image_bytes)
            p2 = model_effnet.predict(img_array_eff, verbose=0)
            probs_list.append(p2[0])
            logger.info(f"✅ EfficientNetB0 prediction: {p2[0]}")
        except Exception as e:
            logger.warning(f"EfficientNetB0 prediction failed: {e}")
    
    # Average predictions from available models
    if len(probs_list) > 0:
        p_ensemble = np.mean(probs_list, axis=0)
        logger.info(f"✅ ENSEMBLE average: {p_ensemble}")
        return p_ensemble.tolist()
    else:
        logger.warning("No models available — returning mock predictions.")
        return mock_predict()

# ─────────────────────────────────────────────
# MongoDB logging (optional)
# ─────────────────────────────────────────────
def log_to_mongodb(prediction, probabilities, filename, client_ip):
    try:
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            return
        from pymongo import MongoClient
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
        db = client[os.getenv("MONGODB_DB", "neurosight")]
        db.predictions.insert_one({
            "prediction": prediction,
            "probabilities": probabilities,
            "fileName": filename,
            "clientIp": client_ip,
            "modelVersion": MODEL_VERSION,
            "createdAt": datetime.now(timezone.utc),
        })
        logger.info("✅ Prediction logged to MongoDB.")
    except Exception as e:
        logger.warning(f"MongoDB logging failed (non-critical): {e}")

# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "models_loaded": {
            "vgg16": model_vgg is not None,
            "efficientnetb0": model_effnet is not None,
        },
        "version": MODEL_VERSION,
        "preprocessing": {
            "vgg16": "64x64 input, / 255.0 normalization",
            "efficientnetb0": "224x224 input, preprocess_input()"
        }
    })

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Send a file with field name 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    # Validate image type
    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if file.content_type not in allowed_types:
        return jsonify({"error": f"Unsupported file type '{file.content_type}'. Use JPG or PNG."}), 400

    try:
        image_bytes = file.read()
        
        # Run ensemble with CORRECT preprocessing for each model
        probs = run_ensemble(image_bytes)

        # Build result
        pred_idx = int(np.argmax(probs))
        pred_label = CLASS_NAMES[pred_idx]
        confidence = float(probs[pred_idx])

        probabilities = {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))}

        # Log to MongoDB (non-blocking)
        client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        log_to_mongodb(pred_label, probabilities, file.filename, client_ip)

        return jsonify({
            "prediction": pred_label,
            "label": CLASS_LABELS[pred_label],
            "confidence": round(confidence, 4),
            "probabilities": {k: round(v, 4) for k, v in probabilities.items()},
            "suggestion": SUGGESTIONS[pred_label],
            "modelVersion": MODEL_VERSION,
        })

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == "__main__":
    load_models()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    logger.info(f"🧠 NeuroSight AI backend starting on port {port}...")
    logger.info(f"📊 VGG16: {VGG16_IMG_SIZE} input, / 255.0 normalization")
    logger.info(f"📊 EfficientNetB0: {EFFICIENTNET_IMG_SIZE} input, preprocess_input()")
    app.run(host="0.0.0.0", port=port, debug=debug)
