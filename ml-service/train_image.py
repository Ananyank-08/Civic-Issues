"""
Image Classifier Training — MobileNetV2 Transfer Learning  (v3 — Fixed)
Trains on the imagedataset/ folder structure and saves image_model.keras

KEY FIX from v2:
  - Augmentation AND preprocessing both happen in the tf.data pipeline
  - Applied in ORDER: raw [0,255] → augment → preprocess_input → model
  - Model graph contains NO Lambda layer and NO augmentation layers
  - This avoids (a) the Lambda serialization bug and (b) the preprocessing
    order bug that caused 25% accuracy in v2

Handles class imbalance via:
  1. Data augmentation in training pipeline (tf.image ops on raw pixels)
  2. Computed class weights (inverse frequency)
  3. Transfer learning from ImageNet pretrained MobileNetV2
  4. Two-phase fine-tuning (frozen base → unfreeze top 30 layers)
"""

import os
import numpy as np
from collections import Counter

# ── Configuration ─────────────────────────────────────────────
DATASET_DIR     = "imagedataset"
MODEL_SAVE_PATH = "image_model.keras"
IMG_SIZE        = (224, 224)
BATCH_SIZE      = 32
EPOCHS          = 30
LEARNING_RATE   = 1e-4
VALIDATION_SPLIT = 0.2
SEED            = 42

FOLDER_TO_CATEGORY = {
    "Pothole_Image_Data":         "Potholes",
    "fallentrees_dataset":        "Treefall",
    "garbage_dataset_3":          "Garbage",
    "invalid":                    "Invalid (Noise/Spam)",
    "others":                     "Others (Valid Civic Issues)",
    "streetlight_issues_dataset": "Streetlight Issue",
    "trafficlight_dataset":       "Traffic Light",
    "waterleak":                  "Water Leakage",
}

CATEGORIES = sorted(FOLDER_TO_CATEGORY.values())


def count_images():
    """Print per-class image counts and return stats."""
    print("\n" + "=" * 50)
    print("DATASET SUMMARY")
    print("=" * 50)
    counts = {}
    for folder, category in sorted(FOLDER_TO_CATEGORY.items()):
        folder_path = os.path.join(DATASET_DIR, folder)
        if os.path.isdir(folder_path):
            n = len([f for f in os.listdir(folder_path)
                     if os.path.isfile(os.path.join(folder_path, f))])
            counts[category] = n
            status = "[OK]" if n >= 300 else ("[LOW]" if n >= 200 else "[!!]")
            print(f"  {status:5s} {category:35s} -> {n:4d} images ({folder})")
        else:
            print(f"  [!!]  MISSING: {folder}")
            counts[category] = 0
    total = sum(counts.values())
    print(f"\n  Total: {total} images across {len(counts)} classes")
    print("=" * 50)
    return counts


def compute_class_weights(train_ds):
    """Compute balanced class weights from training dataset labels."""
    labels = []
    for _, batch_labels in train_ds:
        labels.extend(batch_labels.numpy().tolist())
    counter = Counter(labels)
    total   = sum(counter.values())
    n_cls   = len(counter)
    weights = {cls: total / (n_cls * cnt) for cls, cnt in counter.items()}
    print("\nComputed class weights:")
    for cls_id in sorted(weights):
        print(f"  Class {cls_id} ({CATEGORIES[cls_id]}): {weights[cls_id]:.3f}")
    return weights


def make_augment_fn():
    """
    Returns a tf.function that augments a batch of raw [0,255] uint8 images
    and returns float32 values in [0,255] (preprocess_input applied after).
    Augmentation is randomised per element using tf.image and tf.random ops.
    """
    import tensorflow as tf

    @tf.function
    def _augment(image, label):
        # Cast to float32 for augmentation
        img = tf.cast(image, tf.float32)

        # Random horizontal / vertical flip
        img = tf.image.random_flip_left_right(img)
        img = tf.image.random_flip_up_down(img)

        # Brightness / saturation / contrast (operate correctly on [0,255])
        img = tf.image.random_brightness(img, max_delta=50.0)        # +-50 out of 255
        img = tf.image.random_contrast(img, lower=0.7, upper=1.4)
        img = tf.image.random_saturation(img, lower=0.6, upper=1.5)

        # Random rotation via contrib-less approach (shear-free 90-deg steps)
        k = tf.random.uniform(shape=[], minval=0, maxval=4, dtype=tf.int32)
        img = tf.image.rot90(tf.cast(img, tf.uint8), k)
        img = tf.cast(img, tf.float32)

        # Random zoom (crop centre then resize back)
        zoom = tf.random.uniform([], 0.80, 1.0)
        img_h, img_w = tf.shape(img)[0], tf.shape(img)[1]
        crop_h = tf.cast(tf.cast(img_h, tf.float32) * zoom, tf.int32)
        crop_w = tf.cast(tf.cast(img_w, tf.float32) * zoom, tf.int32)
        off_y  = (img_h - crop_h) // 2
        off_x  = (img_w - crop_w) // 2
        img = img[off_y:off_y + crop_h, off_x:off_x + crop_w, :]
        img = tf.image.resize(img, IMG_SIZE)

        # Clip to valid pixel range before preprocess_input
        img = tf.clip_by_value(img, 0.0, 255.0)
        return img, label

    return _augment



def make_preprocess_fn():
    """Applies MobileNetV2 preprocess_input: [0,255] -> [-1,1]."""
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

    @tf.function
    def _preprocess(image, label):
        img = tf.cast(image, tf.float32)
        img = preprocess_input(img)   # scales [0,255] -> [-1,1]
        return img, label

    return _preprocess


def build_model(num_classes):
    """
    Build MobileNetV2-based classifier.
    No Lambda layers, no augmentation layers — clean Functional API model
    that serialises correctly to .keras without custom_objects.
    """
    import tensorflow as tf
    from tensorflow import keras

    base_model = keras.applications.MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False

    inputs = keras.Input(shape=(*IMG_SIZE, 3), name="image_input")
    # Base expects values already in [-1,1] — handled by preprocess_fn in pipeline
    x = base_model(inputs, training=False)
    x = keras.layers.GlobalAveragePooling2D()(x)
    x = keras.layers.BatchNormalization()(x)
    x = keras.layers.Dropout(0.4)(x)
    x = keras.layers.Dense(256, activation="relu")(x)
    x = keras.layers.BatchNormalization()(x)
    x = keras.layers.Dropout(0.3)(x)
    outputs = keras.layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = keras.Model(inputs, outputs)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model, base_model


def fine_tune_model(model, base_model):
    """Unfreeze last 30 layers of MobileNetV2 and retrain with lower LR."""
    from tensorflow import keras

    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE / 10),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    import tensorflow as tf
    from tensorflow import keras

    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")

    # ── 1. Dataset summary ─────────────────────────────────────
    count_images()

    # ── 2. Load raw images (no preprocessing yet) ───────────────
    print("\nLoading training dataset...")
    train_ds_raw = keras.utils.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=VALIDATION_SPLIT,
        subset="training",
        seed=SEED,
        image_size=IMG_SIZE,
        batch_size=None,           # unbatched — we batch AFTER augmentation
        label_mode="int",
    )

    print("\nLoading validation dataset...")
    val_ds_raw = keras.utils.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=VALIDATION_SPLIT,
        subset="validation",
        seed=SEED,
        image_size=IMG_SIZE,
        batch_size=None,
        label_mode="int",
    )

    # Get class names from dataset (folder-alphabetical order)
    folder_class_names = train_ds_raw.class_names
    print(f"\nDetected folder classes: {folder_class_names}")

    folder_to_category_map = {}
    for idx, folder_name in enumerate(folder_class_names):
        cat = FOLDER_TO_CATEGORY.get(folder_name, folder_name)
        folder_to_category_map[idx] = cat
        print(f"  {idx}: {folder_name} -> {cat}")

    # Save label map
    import json
    label_map = {str(i): folder_to_category_map[i] for i in range(len(folder_class_names))}
    with open("image_label_map.json", "w") as f:
        json.dump(label_map, f, indent=2)
    print("\nSaved label mapping to image_label_map.json")

    # ── 3. Build pipelines ──────────────────────────────────────
    AUTOTUNE = tf.data.AUTOTUNE
    augment_fn    = make_augment_fn()
    preprocess_fn = make_preprocess_fn()

    # Training: augment (on raw [0,255]) THEN preprocess THEN batch
    train_ds = (
        train_ds_raw
        .shuffle(2000, seed=SEED)
        .map(augment_fn,    num_parallel_calls=AUTOTUNE)   # augment raw pixels
        .map(preprocess_fn, num_parallel_calls=AUTOTUNE)   # scale to [-1,1]
        .batch(BATCH_SIZE)
        .prefetch(AUTOTUNE)
    )

    # Validation: preprocess only (no augmentation)
    val_ds = (
        val_ds_raw
        .map(preprocess_fn, num_parallel_calls=AUTOTUNE)
        .batch(BATCH_SIZE)
        .prefetch(AUTOTUNE)
    )

    # ── 4. Compute class weights ────────────────────────────────
    # Use a quick pass over raw (unaugmented) labels
    lbl_ds = train_ds_raw.map(
        preprocess_fn, num_parallel_calls=AUTOTUNE
    ).batch(BATCH_SIZE).prefetch(AUTOTUNE)
    class_weights = compute_class_weights(lbl_ds)

    # ── 5. Build & train Phase 1 (frozen base) ─────────────────
    num_classes = len(folder_class_names)
    model, base_model = build_model(num_classes)

    print("\n" + "=" * 50)
    print("PHASE 1: Training with frozen MobileNetV2 base")
    print("=" * 50)

    callbacks_phase1 = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=6, restore_best_weights=True
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, min_lr=1e-7
        ),
    ]

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        class_weight=class_weights,
        callbacks=callbacks_phase1,
    )

    # ── 6. Fine-tune Phase 2 (unfreeze top 30 layers) ──────────
    print("\n" + "=" * 50)
    print("PHASE 2: Fine-tuning top 30 layers of MobileNetV2")
    print("=" * 50)

    model = fine_tune_model(model, base_model)

    callbacks_phase2 = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5, restore_best_weights=True
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, min_lr=1e-8
        ),
    ]

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=15,
        class_weight=class_weights,
        callbacks=callbacks_phase2,
    )

    # ── 7. Evaluate ─────────────────────────────────────────────
    print("\n" + "=" * 50)
    print("EVALUATION")
    print("=" * 50)

    loss, accuracy = model.evaluate(val_ds)
    print(f"\n  Final Validation Loss:     {loss:.4f}")
    print(f"  Final Validation Accuracy: {accuracy:.4f}")

    y_true, y_pred = [], []
    for images, labels in val_ds:
        preds = model.predict(images, verbose=0)
        y_pred.extend(np.argmax(preds, axis=1).tolist())
        y_true.extend(labels.numpy().tolist())

    from sklearn.metrics import classification_report
    target_names = [folder_to_category_map[i] for i in range(num_classes)]
    print("\nPer-class Classification Report:")
    print(classification_report(y_true, y_pred, target_names=target_names))

    # ── 8. Save model ────────────────────────────────────────────
    model.save(MODEL_SAVE_PATH)
    print(f"\n[OK] Model saved to {MODEL_SAVE_PATH}")
    print("[OK] Label map saved to image_label_map.json")
    print("\nDone! Restart main.py to use the new model.")


if __name__ == "__main__":
    main()
