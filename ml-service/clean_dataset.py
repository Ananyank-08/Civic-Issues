"""
Dataset cleaner — identifies and quarantines mislabeled / ambiguous images.

Scans every class folder and moves images the model predicts with HIGH
confidence as a DIFFERENT class into a review/ subfolder.
These are almost certainly mislabeled or too ambiguous for training.

Usage:  python clean_dataset.py [--confidence 0.65]
"""

import os
import sys
import shutil
import argparse
import json
import numpy as np

DATASET_DIR = "imagedataset"
CONFIDENCE_THRESHOLD = 0.65   # flag if model is >=65% sure it's a different class

FOLDER_TO_LABEL = {
    "Pothole_Image_Data":         "Potholes",
    "garbage_dataset_3":          "Garbage",
    "waterleak":                  "Water Leakage",
    "streetlight_issues_dataset": "Streetlight Issue",
    "fallentrees_dataset":        "Treefall",
    "trafficlight_dataset":       "Traffic Light",
    "others":                     "Others (Valid Civic Issues)",
    "invalid":                    "Invalid (Noise/Spam)",
}


def main(threshold: float):
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
    from PIL import Image

    print(f"Loading model...")
    model = tf.keras.models.load_model(
        "image_model.keras",
        custom_objects={"preprocess_input": preprocess_input}
    )
    with open("image_label_map.json") as f:
        index_to_label = {int(k): v for k, v in json.load(f).items()}

    # Detect whether model has internal Lambda preprocessing
    has_lambda = any("lambda" in l.name.lower() for l in model.layers)

    total_flagged = 0
    print(f"\nScanning dataset (confidence threshold: {threshold:.0%})...")
    print("=" * 65)

    for folder, expected_label in FOLDER_TO_LABEL.items():
        folder_path = os.path.join(DATASET_DIR, folder)
        if not os.path.isdir(folder_path):
            continue

        # Only check ORIGINAL images (skip already-augmented ones)
        files = [
            f for f in os.listdir(folder_path)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
            and not f.startswith("aug_")
        ]

        review_dir = os.path.join(folder_path, "review")
        flagged = 0

        for fn in files:
            fpath = os.path.join(folder_path, fn)
            try:
                img = Image.open(fpath).convert("RGB").resize((224, 224))
                arr = np.array(img, dtype=np.float32)
                if not has_lambda:
                    arr = preprocess_input(arr)
                arr = np.expand_dims(arr, axis=0)
                preds = model.predict(arr, verbose=0)[0]
                pred_idx = int(np.argmax(preds))
                pred_conf = float(preds[pred_idx])
                pred_label = index_to_label.get(pred_idx, "Unknown")

                if pred_label != expected_label and pred_conf >= threshold:
                    # Flag this image — move to review subfolder
                    os.makedirs(review_dir, exist_ok=True)
                    dst = os.path.join(review_dir, fn)
                    shutil.move(fpath, dst)
                    print(f"  [FLAG] {folder}/{fn}")
                    print(f"         Expected: {expected_label}  |  Predicted: {pred_label} ({pred_conf:.0%})")
                    flagged += 1
                    total_flagged += 1

            except Exception as e:
                print(f"  [ERR ] {fn}: {e}")

        remaining = len(files) - flagged
        if flagged > 0:
            print(f"  -> {folder}: moved {flagged} suspect images to review/ ({remaining} remain)")
        else:
            print(f"  [CLEAN] {folder}: all {len(files)} images OK")

    print("=" * 65)
    print(f"Total flagged & quarantined: {total_flagged} images")
    print(f"Review images are in imagedataset/<class>/review/ — inspect before deleting.")
    if total_flagged > 0:
        print(f"\nNow run:  python train_image.py  to retrain on the cleaned dataset.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--confidence", type=float, default=CONFIDENCE_THRESHOLD)
    args = parser.parse_args()
    main(args.confidence)
