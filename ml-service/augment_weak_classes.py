"""
Targeted augmentation for weak classes before retraining.
Garbage: 322 -> ~650 images
Invalid:  219 -> ~400 images
Waterleak: 210 -> ~420 images  (boost just in case)

Run this ONCE before running train_image.py to retrain.
"""

import os
import random
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

TARGET_EXTRA = {
    "garbage_dataset_3":          330,   # needs the most help
    "invalid":                    180,   # small class
    "waterleak":                  210,   # boost a bit
}

DATASET_DIR = "imagedataset"


def augment_image(img: Image.Image, idx: int) -> Image.Image:
    """Apply a deterministic but varied augmentation based on idx."""
    ops = idx % 12

    # Geometric
    if ops == 0:
        img = img.rotate(random.uniform(-25, 25), expand=False)
    elif ops == 1:
        img = ImageOps.mirror(img)
    elif ops == 2:
        img = ImageOps.flip(img)
    elif ops == 3:
        img = img.rotate(random.uniform(-15, 15), expand=False)
        img = ImageOps.mirror(img)
    elif ops == 4:
        # Center crop then resize back
        w, h = img.size
        margin = int(min(w, h) * 0.15)
        img = img.crop((margin, margin, w - margin, h - margin))
        img = img.resize((w, h), Image.BILINEAR)
    elif ops == 5:
        # Perspective-like shear via transform
        w, h = img.size
        shear = random.uniform(-0.1, 0.1)
        img = img.transform((w, h), Image.AFFINE,
                             (1, shear, 0, 0, 1, 0), Image.BILINEAR)
    # Color / texture
    elif ops == 6:
        img = ImageEnhance.Brightness(img).enhance(random.uniform(0.5, 1.5))
    elif ops == 7:
        img = ImageEnhance.Contrast(img).enhance(random.uniform(0.4, 1.8))
    elif ops == 8:
        img = ImageEnhance.Color(img).enhance(random.uniform(0.2, 1.8))
    elif ops == 9:
        img = ImageEnhance.Sharpness(img).enhance(random.uniform(0.0, 2.5))
    elif ops == 10:
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(1, 3)))
    elif ops == 11:
        # Combined: flip + brightness + contrast
        img = ImageOps.mirror(img)
        img = ImageEnhance.Brightness(img).enhance(random.uniform(0.6, 1.4))
        img = ImageEnhance.Contrast(img).enhance(random.uniform(0.7, 1.5))

    return img


def augment_class(folder_name: str, n_extra: int):
    """Generate n_extra augmented copies for a class folder."""
    folder_path = os.path.join(DATASET_DIR, folder_name)
    files = [
        f for f in os.listdir(folder_path)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
        and not f.startswith("aug_")   # skip already-augmented files
    ]

    if not files:
        print(f"  [SKIP] {folder_name}: no source images found")
        return

    existing_aug = len([f for f in os.listdir(folder_path) if f.startswith("aug_")])
    if existing_aug >= n_extra:
        print(f"  [SKIP] {folder_name}: already has {existing_aug} augmented images")
        return

    start = existing_aug
    generated = 0
    idx = start

    while generated < (n_extra - existing_aug):
        src_file = random.choice(files)
        src_path = os.path.join(folder_path, src_file)
        try:
            img = Image.open(src_path).convert("RGB").resize((300, 300))
            aug = augment_image(img, idx)
            out_name = f"aug_{idx:04d}.jpg"
            aug.save(os.path.join(folder_path, out_name), "JPEG", quality=90)
            generated += 1
            idx += 1
        except Exception as e:
            print(f"    Warning: skipped {src_file} -> {e}")
            idx += 1

    print(f"  [OK] {folder_name}: generated {generated} new augmented images "
          f"(total now: {len(files) + existing_aug + generated})")


def main():
    print("=" * 55)
    print("TARGETED DATA AUGMENTATION FOR WEAK CLASSES")
    print("=" * 55)
    for folder, n_extra in TARGET_EXTRA.items():
        print(f"\nAugmenting: {folder} (+{n_extra} images)")
        augment_class(folder, n_extra)
    print("\n" + "=" * 55)
    print("Done! Now run: python train_image.py")
    print("=" * 55)


if __name__ == "__main__":
    main()
