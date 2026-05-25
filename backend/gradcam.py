import numpy as np
import tensorflow as tf
import cv2

LAST_CONV = "conv2d_2"   # 128-filter layer — last conv before flatten


def generate_gradcam(model, img_array):
    grad_model = tf.keras.models.Model(
        inputs=model.inputs,
        outputs=[model.get_layer(LAST_CONV).output, model.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array, training=False)
        loss = predictions[:, 0]

    grads       = tape.gradient(loss, conv_outputs)
    pooled      = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_out    = conv_outputs[0]
    heatmap     = tf.squeeze(conv_out @ pooled[..., tf.newaxis])
    heatmap     = tf.maximum(heatmap, 0)
    heatmap     = heatmap / (tf.math.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy()


def overlay_gradcam(original_bgr, heatmap, alpha=0.5):
    h, w        = original_bgr.shape[:2]
    resized     = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_CUBIC)
    colored     = cv2.applyColorMap(np.uint8(255 * resized), cv2.COLORMAP_JET)
    overlay     = cv2.addWeighted(original_bgr, 1 - alpha, colored, alpha, 0)
    return overlay, resized


def extract_hot_regions(heatmap_resized, original_bgr, threshold=0.55):
    h, w    = original_bgr.shape[:2]
    binary  = (heatmap_resized >= threshold).astype(np.uint8) * 255
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    regions = []
    for cnt in contours:
        x, y, rw, rh = cv2.boundingRect(cnt)
        area = rw * rh
        if area < (h * w * 0.005):
            continue
        cx  = (x + rw / 2) / w
        cy  = (y + rh / 2) / h
        regions.append({
            "zone":       _zone(cx, cy),
            "bbox":       [int(x), int(y), int(rw), int(rh)],
            "activation": round(float(np.mean(heatmap_resized[y:y+rh, x:x+rw])), 4),
            "area_pct":   round(area / (h * w) * 100, 2)
        })

    regions.sort(key=lambda r: r["activation"], reverse=True)
    return regions


def _zone(rx, ry):
    if ry < 0.20:
        return "hair / forehead boundary"
    elif ry < 0.40:
        if rx < 0.40:   return "left eye region"
        elif rx > 0.60: return "right eye region"
        else:           return "nose bridge"
    elif ry < 0.60:
        if rx < 0.30:   return "left cheek"
        elif rx > 0.70: return "right cheek"
        else:           return "nose / mid-face"
    elif ry < 0.80:
        return "mouth / lip region"
    else:
        return "chin / jaw boundary"
