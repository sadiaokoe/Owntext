from PIL import Image
import os
import shutil

# Source icon
source = r"C:\Users\User\.gemini\antigravity-ide\brain\6c2f54f3-2ad9-4280-974e-334a32f6f4a2\owntext_app_icon_1782823432687.png"
res_dir = r"E:\Web App\Personal\Owntext\android-app\app\src\main\res"

# Android mipmap sizes
sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

img = Image.open(source)

for folder, size in sizes.items():
    target_dir = os.path.join(res_dir, folder)
    os.makedirs(target_dir, exist_ok=True)
    
    resized = img.resize((size, size), Image.LANCZOS)
    
    # Save both ic_launcher.png and ic_launcher_round.png
    resized.save(os.path.join(target_dir, "ic_launcher.png"), "PNG")
    resized.save(os.path.join(target_dir, "ic_launcher_round.png"), "PNG")
    print(f"Saved {folder} ({size}x{size})")

print("Done! All icons resized.")
