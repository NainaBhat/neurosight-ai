import os
import gdown

os.makedirs("models", exist_ok=True)

models = {
    "efficientnetv2_model.keras": "1_jS8akRhkfFq7cu88NicRaw4mR9vOele ",
    "brain_tumor_detection_vgg16.keras": "17Yk_w75waeVzv7Sr7qvgeNDlYOd6B_Lh"
}

for filename, file_id in models.items():
    output = f"models/{filename}"
    if not os.path.exists(output):
        print(f"Downloading {filename}...")
        gdown.download(f"https://drive.google.com/uc?id={file_id}", output, quiet=False)

print("All models downloaded!")
