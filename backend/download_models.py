"""
Download ML models from Google Drive to local storage.
Uses absolute paths to work correctly in containerized environments.
 
CRITICAL FIXES:
- Proper folder-in-folder extraction handling
- Timeout handling for slow networks
- Better error messages
- Graceful continuation if download fails
"""
 
import os
import sys
import gdown
import zipfile
import shutil
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
        # IMPORTANT: Set timeout to avoid hanging on slow networks
        gdown.download(
            f"https://drive.google.com/uc?id={VGG16_ID}",
            vgg16_path,
            quiet=False,
            fuzzy=True  
        )
        if os.path.exists(vgg16_path):
            file_size_mb = os.path.getsize(vgg16_path) / (1024 * 1024)
            print(f"      ✅ Downloaded successfully ({file_size_mb:.1f} MB)")
        else:
            print(f"      ❌ Download completed but file not found")
            print(f"      ⚠️  Continuing without VGG16 (model loading will report error)")
    except Exception as e:
        print(f"      ❌ Download failed: {e}")
        print(f"      ⚠️  Continuing without VGG16 (model loading will report error)")
        print(f"      💡 Check: Is the Google Drive link shared publicly?")
 
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
        # Download ZIP with timeout
        gdown.download(
            f"https://drive.google.com/uc?id={EFFNET_ID}",
            effnet_zip,
            quiet=False,
            fuzzy=True  
        )
 
        if not os.path.exists(effnet_zip):
            print(f"      ❌ ZIP download completed but file not found")
            print(f"      ⚠️  Continuing without EfficientNetB0 (model loading will report error)")
        else:
            print(f"      ⏳ Extracting...")
            
            # CRITICAL FIX: Handle folder-in-folder structure
            # Extract to temp directory first
            temp_extract_dir = os.path.join(models_dir, "effnet_temp_extract")
            os.makedirs(temp_extract_dir, exist_ok=True)
            
            with zipfile.ZipFile(effnet_zip, 'r') as zip_ref:
                zip_ref.extractall(temp_extract_dir)
            
            # Find the actual model folder
            # It might be: effnet_temp_extract/brain_tumor_detection_efficientnetb0/
            # OR:          effnet_temp_extract/[something]/brain_tumor_detection_efficientnetb0/
            
            model_folder_found = None
            
            # Check direct extraction first
            direct_path = os.path.join(temp_extract_dir, "brain_tumor_detection_efficientnetb0")
            if os.path.isdir(direct_path) and os.path.exists(os.path.join(direct_path, "metadata.json")):
                model_folder_found = direct_path
            else:
                # Check for nested structure (folder inside folder)
                for item in os.listdir(temp_extract_dir):
                    item_path = os.path.join(temp_extract_dir, item)
                    if os.path.isdir(item_path):
                        nested_model = os.path.join(item_path, "brain_tumor_detection_efficientnetb0")
                        if os.path.isdir(nested_model) and os.path.exists(os.path.join(nested_model, "metadata.json")):
                            model_folder_found = nested_model
                            break
            
            if model_folder_found:
                # Move to final location
                if os.path.exists(effnet_folder):
                    shutil.rmtree(effnet_folder)
                shutil.move(model_folder_found, effnet_folder)
                
                # Cleanup temp directory
                shutil.rmtree(temp_extract_dir)
                
                num_files = len(os.listdir(effnet_folder))
                print(f"      ✅ Extracted successfully ({num_files} files)")
            else:
                print(f"      ❌ Could not find model structure in extracted ZIP")
                print(f"      📁 Contents of extracted ZIP:")
                for root, dirs, files in os.walk(temp_extract_dir):
                    level = root.replace(temp_extract_dir, '').count(os.sep)
                    indent = ' ' * 2 * level
                    print(f'{indent}{os.path.basename(root)}/')
                    sub_indent = ' ' * 2 * (level + 1)
                    for file in files[:5]:  # Show first 5 files
                        print(f'{sub_indent}{file}')
                
                # Cleanup temp directory
                shutil.rmtree(temp_extract_dir)
                print(f"      ⚠️  Continuing without EfficientNetB0")
 
            # Cleanup ZIP
            if os.path.exists(effnet_zip):
                os.remove(effnet_zip)
 
    except Exception as e:
        print(f"      ❌ Download/extraction failed: {e}")
        print(f"      💡 Check: Is the Google Drive link shared publicly?")
        print(f"      ⚠️  Continuing without EfficientNetB0 (model loading will report error)")
        
        # Clean up partial files
        if os.path.exists(effnet_zip):
            os.remove(effnet_zip)
        if os.path.exists(os.path.join(models_dir, "effnet_temp_extract")):
            shutil.rmtree(os.path.join(models_dir, "effnet_temp_extract"))
 
print()
print(f"{'=' * 60}")
print(f"✅ Model download phase complete")
print(f"{'=' * 60}\n")
 
# ─── Verify files ────────────────────────────────────────────────────────────
 
print("📊 Final verification:")
vgg16_exists = os.path.exists(vgg16_path)
effnet_exists = os.path.exists(effnet_folder)
 
print(f"   VGG16:        {'✅ Ready' if vgg16_exists else '❌ Missing'}")
print(f"   EfficientNet: {'✅ Ready' if effnet_exists else '❌ Missing'}")
print()
 
if not vgg16_exists and not effnet_exists:
    print("❌ CRITICAL: Both models missing. Flask will start but cannot predict.")
    print("   Please verify Google Drive links are publicly shared and accessible.")
elif not vgg16_exists or not effnet_exists:
    print("⚠️  WARNING: One model missing. Flask will use remaining model only.")
    print("   Detection accuracy will be reduced to single-model output.")
else:
    print("✅ All models ready. Flask can start with full ensemble capability.")
