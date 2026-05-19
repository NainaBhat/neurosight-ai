"""
Download ML models from Google Drive to local storage.
Uses absolute paths to work correctly in containerized environments.
"""

import os
import sys
import gdown
import zipfile
from pathlib import Path

# ─── CRITICAL: Use absolute paths ────────────────────────────────────────────
script_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.getenv('MODELS_DIR', os.path.join(script_dir, 'models'))

# Ensure directory exists
os.makedirs(models_dir, exist_ok=True)

print(f"📦 Model Download Manager")
print(f"{'=' * 60}")
print(f"Script directory:  {script_dir}")
print(f"Models directory:  {models_dir}")
print(f"{'=' * 60}\n")

# ─── VGG16 Model ─────────────────────────────────────────────────────────────

VGG16_ID = "1v7eWOVxTO2Sk_V0Ohkq3oSJu2oo1tNL_"  
vgg16_path = os.path.join(models_dir, "brain_tumor_detection_vgg16.keras")

print("[1/2] VGG16 Model (64x64 input, /255.0 normalization)")
print(f"      File: {vgg16_path}")

if os.path.exists(vgg16_path):
    file_size_mb = os.path.getsize(vgg16_path) / (1024 * 1024)
    print(f"      ✅ Already exists ({file_size_mb:.1f} MB)")
else:
    print(f"      ⏳ Downloading from Google Drive...")
    try:
        gdown.download(
            f"https://drive.google.com/uc?id={VGG16_ID}",
            vgg16_path,
            quiet=False
        )
        if os.path.exists(vgg16_path):
            file_size_mb = os.path.getsize(vgg16_path) / (1024 * 1024)
            print(f"      ✅ Downloaded successfully ({file_size_mb:.1f} MB)")
        else:
            print(f"      ❌ Download completed but file not found")
    except Exception as e:
        print(f"      ❌ Download failed: {e}")
        sys.exit(1)

print()

# ─── EfficientNetB0 Model ────────────────────────────────────────────────────

EFFNET_ID = "1-gOnI_MLvfrJB2goQlDHEiH2r2n4Nmer"  
effnet_folder = os.path.join(models_dir, "brain_tumor_detection_efficientnetb0")
effnet_zip = os.path.join(models_dir, "effnet_temp.zip")

print("[2/2] EfficientNetB0 Model (224x224 input, preprocess_input)")
print(f"      Folder: {effnet_folder}")

if os.path.exists(effnet_folder):
    num_files = len(os.listdir(effnet_folder))
    print(f"      ✅ Already exists ({num_files} files)")
else:
    print(f"      ⏳ Downloading from Google Drive...")
    try:
        # Download ZIP
        gdown.download(
            f"https://drive.google.com/uc?id={EFFNET_ID}",
            effnet_zip,
            quiet=False
        )

        if not os.path.exists(effnet_zip):
            print(f"      ❌ ZIP download completed but file not found")
            sys.exit(1)

        print(f"      ⏳ Extracting...")
        # Extract ZIP
        with zipfile.ZipFile(effnet_zip, 'r') as zip_ref:
            zip_ref.extractall(models_dir)

        # Cleanup ZIP
        os.remove(effnet_zip)

        if os.path.exists(effnet_folder):
            num_files = len(os.listdir(effnet_folder))
            print(f"      ✅ Extracted successfully ({num_files} files)")
        else:
            print(f"      ❌ Extraction completed but folder not found")
            sys.exit(1)

    except Exception as e:
        print(f"      ❌ Download/extraction failed: {e}")
        # Clean up partial ZIP if it exists
        if os.path.exists(effnet_zip):
            os.remove(effnet_zip)
        sys.exit(1)

print()
print(f"{'=' * 60}")
print(f"✅ Model download verification complete")
print(f"{'=' * 60}\n")

# ─── Verify files ────────────────────────────────────────────────────────────

print("📊 Final verification:")
vgg16_exists = os.path.exists(vgg16_path)
effnet_exists = os.path.exists(effnet_folder)

print(f"   VGG16:        {'✅ Ready' if vgg16_exists else '❌ Missing'}")
print(f"   EfficientNet: {'✅ Ready' if effnet_exists else '❌ Missing'}")
print()

if not vgg16_exists or not effnet_exists:
    print("❌ Models not ready. Flask will start without models.")
    sys.exit(1)

print("✅ All models ready. Flask can start.")
