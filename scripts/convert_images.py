from PIL import Image
import os

images = ['shield.png', 'logo.png']

for img_name in images:
    if os.path.exists(img_name):
        try:
            img = Image.open(img_name)
            # Convert to RGB (remove transparency if any, replacing with white)
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                bg = Image.new('RGB', img.size, (255, 255, 255))
                bg.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
                img = bg
            else:
                img = img.convert('RGB')
            
            new_name = os.path.splitext(img_name)[0] + '.jpg'
            img.save(new_name, 'JPEG', quality=95)
            print(f"Converted {img_name} to {new_name}")
        except Exception as e:
            print(f"Failed to convert {img_name}: {e}")
