python
import os
import gdown
import shutil
from pathlib import Path

os.makedirs("models", exist_ok=True)

# VGG16 - Single .keras file
vgg16_id = "1v7eWOVxTO2Sk_V0Ohkq3oSJu2oo1tNL_"  
vgg16_output = "models/brain_tumor_detection_vgg16.keras"

if not os.path.exists(vgg16_output):
    print(f"[1/2] Downloading VGG16 model...")
    try:
        gdown.download(f"https://drive.google.com/uc?id={vgg16_id}", vgg16_output, quiet=False)
        print(f"✅ VGG16 saved to {vgg16_output}")
    except Exception as e:
        print(f"❌ VGG16 download failed: {e}")
else:
    print(f"✅ VGG16 already exists at {vgg16_output}")

# EfficientNetB0 - FOLDER with config.json, metadata.json, model.weights.h5
# This is downloaded as a .zip, then extracted
effnet_id = "1-gOnI_MLvfrJB2goQlDHEiH2r2n4Nmer"  
effnet_zip = "models/effnet_temp.zip"
effnet_folder = "models/brain_tumor_detection_efficientnetb0"

if not os.path.exists(effnet_folder):
    print(f"[2/2] Downloading EfficientNetB0 model (folder)...")
    try:
        # Download the ZIP
        gdown.download(
            f"https://drive.google.com/uc?id={effnet_id}", 
            effnet_zip, 
            quiet=False
        )
        print(f"✅ EfficientNetB0 ZIP downloaded")
        
        # Extract it
        import zipfile
        with zipfile.ZipFile(effnet_zip, 'r') as zip_ref:
            zip_ref.extractall("models/")
        print(f"✅ EfficientNetB0 extracted to {effnet_folder}")
        
        # Clean up ZIP
        os.remove(effnet_zip)
        
    except Exception as e:
        print(f"❌ EfficientNetB0 download/extraction failed: {e}")
else:
    print(f"✅ EfficientNetB0 already exists at {effnet_folder}")

print("\n🎉 Model download check complete!")
