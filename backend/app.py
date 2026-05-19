"""
Flask backend for MRI brain tumor detection.
Ensemble model: VGG16 + EfficientNetB0
 
Key fixes:
- Absolute path handling for models
- Robust error handling and logging
- Proper preprocessing for each model
- MongoDB logging support
"""
 
import os
import io
import logging
import numpy as np
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
 
# ─── TensorFlow Import ───────────────────────────────────────────────────────
 
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError as e:
    TF_AVAILABLE = False
    tf = None
 
# ─── Logging Setup ───────────────────────────────────────────────────────────
 
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)
 
if not TF_AVAILABLE:
    logger.error("❌ TensorFlow import FAILED. Models cannot be loaded.")
else:
    logger.info(f"✅ TensorFlow {tf.__version__} available")
 
# ─── Flask App Setup ───────────────────────────────────────────────────────
 
app = Flask(__name__)
cors_origins = os.getenv("CORS_ORIGINS", "*")
CORS(app, resources={r"/*": {"origins": cors_origins}})
 
logger.info(f"CORS enabled for: {cors_origins}")
 
# ─── Model Configuration ───────────────────────────────────────────────────
 
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]
CLASS_LABELS = {
    "glioma": "Glioma",
    "meningioma": "Meningioma",
    "notumor": "No Tumor",
    "pituitary": "Pituitary Tumor",
}
 
# CRITICAL: Different input sizes for each model!
VGG16_IMG_SIZE = (64, 64)
EFFICIENTNET_IMG_SIZE = (224, 224)
 
MODEL_VERSION = "vgg16+efficientnetb0-ensemble-v1"
 
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
 
# ─── Global Model Variables ────────────────────────────────────────────────
 
model_vgg = None
model_effnet = None
 
# ─── Model Loading Function ──────────────────────────────────────────────────
 
def load_models():
    """
    Load both VGG16 and EfficientNetB0 models from disk.
    Uses absolute paths to work in containerized environments.
    """
    global model_vgg, model_effnet
 
    if not TF_AVAILABLE:
        logger.error("❌ TensorFlow not available. Models cannot be loaded.")
        return
 
    try:
        # CRITICAL: Use absolute path
        models_dir = os.path.abspath(
            os.getenv("MODELS_DIR", 
                      os.path.join(os.path.dirname(__file__), "models"))
        )
        os.makedirs(models_dir, exist_ok=True)
        logger.info(f"📂 Models directory: {models_dir}")
 
        # ─── VGG16 Loading ───
 
        vgg_path = os.path.join(models_dir, "brain_tumor_detection_vgg16.keras")
 
        if os.path.exists(vgg_path):
            try:
                logger.info(f"📥 Loading VGG16 from {vgg_path}...")
                model_vgg = tf.keras.models.load_model(vgg_path)
                logger.info("✅ VGG16 loaded successfully")
                logger.info(f"   Input: {VGG16_IMG_SIZE}, Normalization: /255.0")
            except Exception as e:
                logger.error(f"❌ Failed to load VGG16: {e}")
                import traceback
                logger.error(traceback.format_exc())
                model_vgg = None
        else:
            logger.error(f"❌ VGG16 file not found: {vgg_path}")
            if os.path.exists(models_dir):
                logger.error(f"   Directory contents: {os.listdir(models_dir)}")
            model_vgg = None
 
        # ─── EfficientNetB0 Loading ───
 
        effnet_path = os.path.join(models_dir, "brain_tumor_detection_efficientnetb0")
 
        if os.path.exists(effnet_path):
            try:
                logger.info(f"📥 Loading EfficientNetB0 from {effnet_path}...")
                model_effnet = tf.keras.models.load_model(effnet_path)
                logger.info("✅ EfficientNetB0 loaded successfully")
                logger.info(f"   Input: {EFFICIENTNET_IMG_SIZE}, Normalization: preprocess_input")
            except Exception as e:
                logger.error(f"❌ Failed to load EfficientNetB0: {e}")
                import traceback
                logger.error(traceback.format_exc())
                model_effnet = None
        else:
            logger.error(f"❌ EfficientNetB0 folder not found: {effnet_path}")
            if os.path.exists(models_dir):
                logger.error(f"   Directory contents: {os.listdir(models_dir)}")
            model_effnet = None
 
        # ─── Summary ───
 
        logger.info("=" * 60)
        logger.info("Model Loading Summary:")
        logger.info(f"  VGG16:         {'🟢 LOADED' if model_vgg else '🔴 FAILED'}")
        logger.info(f"  EfficientNetB0: {'🟢 LOADED' if model_effnet else '🔴 FAILED'}")
        logger.info(f"  Ready to predict: {'YES' if (model_vgg or model_effnet) else 'NO'}")
        logger.info("=" * 60)
 
    except Exception as e:
        logger.error(f"❌ Critical error in load_models(): {e}")
        import traceback
        logger.error(traceback.format_exc())
 
# ─── Image Preprocessing ──────────────────────────────────────────────────────
 
def preprocess_image_for_vgg16(image_bytes):
    """
    Preprocess for VGG16: 64x64, /255.0 normalization.
    CRITICAL: Must match training preprocessing exactly!
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(VGG16_IMG_SIZE, Image.LANCZOS)
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)  # (1, 64, 64, 3)
    return img_array
 
def preprocess_image_for_efficientnet(image_bytes):
    """
    Preprocess for EfficientNetB0: 224x224, preprocess_input() normalization.
    CRITICAL: Must use preprocess_input() for correct scaling!
    """
    try:
        from tensorflow.keras.applications.efficientnet import preprocess_input
    except ImportError:
        logger.error("❌ Could not import preprocess_input")
        # Fallback
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize(EFFICIENTNET_IMG_SIZE, Image.LANCZOS)
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
 
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(EFFICIENTNET_IMG_SIZE, Image.LANCZOS)
    img_array = np.array(img, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)  # (1, 224, 224, 3)
    img_array = preprocess_input(img_array)  # CRITICAL!
    return img_array
 
# ─── Ensemble Prediction ──────────────────────────────────────────────────────
 
def run_ensemble(image_bytes):
    """
    Run both models with their correct preprocessing and average results.
    Falls back gracefully if one model fails.
    """
    probs_list = []
 
    # ─── VGG16 ───
    if model_vgg is not None:
        try:
            img_array_vgg = preprocess_image_for_vgg16(image_bytes)
            p1 = model_vgg.predict(img_array_vgg, verbose=0)
            probs_list.append(p1[0])
            logger.info(f"✅ VGG16: {p1[0]}")
        except Exception as e:
            logger.warning(f"⚠️  VGG16 prediction failed: {e}")
 
    # ─── EfficientNetB0 ───
    if model_effnet is not None:
        try:
            img_array_eff = preprocess_image_for_efficientnet(image_bytes)
            p2 = model_effnet.predict(img_array_eff, verbose=0)
            probs_list.append(p2[0])
            logger.info(f"✅ EfficientNetB0: {p2[0]}")
        except Exception as e:
            logger.warning(f"⚠️  EfficientNetB0 prediction failed: {e}")
 
    # ─── Average ───
    if len(probs_list) > 0:
        p_ensemble = np.mean(probs_list, axis=0)
        logger.info(f"✅ Ensemble average: {p_ensemble}")
        return p_ensemble.tolist()
    else:
        logger.warning("❌ No models available for prediction!")
        # Return mock data (should not happen in production)
        return [0.25, 0.25, 0.25, 0.25]
 
# ─── MongoDB Logging ──────────────────────────────────────────────────────────
 
def log_to_mongodb(prediction, probabilities, filename, client_ip):
    """Log prediction to MongoDB (non-blocking)."""
    try:
        mongo_uri = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
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
        logger.info("✅ Logged to MongoDB")
    except Exception as e:
        logger.warning(f"⚠️  MongoDB logging failed (non-critical): {e}")
 
# ─── Flask Routes ─────────────────────────────────────────────────────────────
 
@app.route("/health", methods=["GET"])
def health():
    """
    Health check endpoint.
    Returns model loading status.
    """
    return jsonify({
        "status": "ok",
        "models_loaded": {
            "vgg16": model_vgg is not None,
            "efficientnetb0": model_effnet is not None,
        },
        "version": MODEL_VERSION,
        "preprocessing": {
            "vgg16": "64x64, /255.0",
            "efficientnetb0": "224x224, preprocess_input()"
        }
    })
 
@app.route("/status", methods=["GET"])
def status():
    """
    Detailed status endpoint.
    Frontend should call this first to check readiness.
    """
    return jsonify({
        "tensorflow_available": TF_AVAILABLE,
        "vgg16_loaded": model_vgg is not None,
        "efficientnetb0_loaded": model_effnet is not None,
        "ready": TF_AVAILABLE and (model_vgg is not None or model_effnet is not None),
        "version": MODEL_VERSION,
    })
 
@app.route("/predict", methods=["POST"])
def predict():
    """
    MRI prediction endpoint.
    Accepts multipart form-data with 'file' field.
    Returns JSON with prediction, confidence, probabilities.
    """
    if "file" not in request.files:
        logger.warning("❌ No file in request")
        return jsonify({"error": "No file provided. Use field name 'file'."}), 400
 
    file = request.files["file"]
    if file.filename == "":
        logger.warning("❌ Empty filename")
        return jsonify({"error": "Empty filename."}), 400
 
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if file.content_type not in allowed_types:
        logger.warning(f"❌ Invalid file type: {file.content_type}")
        return jsonify({
            "error": f"Unsupported file type '{file.content_type}'. Use JPG or PNG."
        }), 400
 
    try:
        # Check if models are loaded
        if not TF_AVAILABLE:
            return jsonify({
                "error": "TensorFlow is not available",
                "type": "InitializationError"
            }), 500
 
        if model_vgg is None and model_effnet is None:
            return jsonify({
                "error": "No models loaded. Check backend logs.",
                "type": "ModelLoadError"
            }), 500
 
        # Read image
        image_bytes = file.read()
        logger.info(f"📷 Processing image: {file.filename} ({len(image_bytes)} bytes)")
 
        # Run ensemble
        probs = run_ensemble(image_bytes)
 
        # Build prediction result
        pred_idx = int(np.argmax(probs))
        pred_label = CLASS_NAMES[pred_idx]
        confidence = float(probs[pred_idx])
 
        probabilities = {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))}
 
        # Log to MongoDB
        client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
        log_to_mongodb(pred_label, probabilities, file.filename, client_ip)
 
        # Return result
        result = {
            "prediction": pred_label,
            "label": CLASS_LABELS[pred_label],
            "confidence": round(confidence, 4),
            "probabilities": {k: round(v, 4) for k, v in probabilities.items()},
            "suggestion": SUGGESTIONS[pred_label],
            "modelVersion": MODEL_VERSION,
        }
 
        logger.info(f"✅ Prediction: {pred_label} (confidence: {confidence:.2%})")
        return jsonify(result)
 
    except Exception as e:
        logger.error(f"❌ Prediction error: {e}")
        import traceback
        logger.error(traceback.format_exc())
 
        return jsonify({
            "error": f"Prediction failed: {str(e)}",
            "type": type(e).__name__,
        }), 500
 
# ─── Error Handlers ───────────────────────────────────────────────────────────
 
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404
 
@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal error: {e}")
    return jsonify({"error": "Internal server error"}), 500
 
# ─── Main ─────────────────────────────────────────────────────────────────────
 
if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("🧠 NeuroSight AI - Flask Backend")
    logger.info("=" * 60)
 
    # Load models
    load_models()
 
    # Start Flask
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
 
    logger.info(f"🚀 Starting Flask on port {port} (debug={debug})")
    logger.info(f"📊 TensorFlow: {TF_AVAILABLE}")
    logger.info(f"📊 VGG16 input: {VGG16_IMG_SIZE}, /255.0 norm")
    logger.info(f"📊 EfficientNetB0 input: {EFFICIENTNET_IMG_SIZE}, preprocess_input")
    logger.info("=" * 60)
 
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        use_reloader=False  # Disable reloader in subprocess
    )
 
