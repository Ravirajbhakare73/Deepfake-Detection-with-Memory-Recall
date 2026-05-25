ZONE_MAP = {
    "hair / forehead boundary": ("Blending boundary artifact", "GAN models struggle at the hair-skin transition. Inconsistent texture frequencies here are a common sign of synthetic generation."),
    "left eye region":          ("Synthetic eye texture",      "Irregular iris patterns, unnatural catchlights, or eye asymmetry are strong indicators of AI-generated faces."),
    "right eye region":         ("Synthetic eye texture",      "Irregular iris patterns, unnatural catchlights, or eye asymmetry are strong indicators of AI-generated faces."),
    "nose bridge":              ("Geometric inconsistency",    "The nose bridge often reveals lighting and perspective errors that 2D GANs struggle to model correctly."),
    "left cheek":               ("Skin texture anomaly",       "Over-smoothing or unnatural specularity in cheek regions are typical GAN upsampling side effects."),
    "right cheek":              ("Skin texture anomaly",       "Over-smoothing or unnatural specularity in cheek regions are typical GAN upsampling side effects."),
    "nose / mid-face":          ("Mid-face blending seam",     "The central face is a common blend zone in face-swap deepfakes, often leaving subtle texture seams."),
    "mouth / lip region":       ("Lip/teeth rendering flaw",   "Teeth and lip edges are difficult for generative models — blurred teeth or unnatural gradients are common deepfake markers."),
    "chin / jaw boundary":      ("Jaw boundary seam",          "The jawline is a primary artifact site in face-swaps — mismatched skin tone or shadow discontinuity often appear here."),
}

DEFAULT = ("Texture/frequency anomaly", "Statistical irregularities detected that deviate from natural image distributions — possibly GAN upsampling or blending artifacts.")


def build_explanation(label, confidence, regions, similar_cases):
    is_fake = label == "FAKE"
    pct     = round(confidence, 1)

    if is_fake:
        verdict = f"This image is likely AI-generated or manipulated ({pct}% confidence)." if pct >= 65 else f"Weak signs of manipulation detected ({pct}% confidence)."
    else:
        verdict = f"This image appears authentic ({pct}% confidence)." if pct >= 65 else f"Classified as real, but with low confidence ({pct}%). Treat with caution."

    confidence_note = f"The model is {pct}% confident this image is {label}."

    region_details = []
    for r in regions[:5]:
        artifact, detail = ZONE_MAP.get(r["zone"], DEFAULT)
        region_details.append({
            "zone":       r["zone"],
            "artifact":   artifact,
            "detail":     detail,
            "activation": r["activation"],
            "area_pct":   r["area_pct"],
            "bbox":       r["bbox"]
        })

    memory_context = None
    if similar_cases:
        fake_count = sum(1 for c in similar_cases if c["label"] == "FAKE")
        real_count = len(similar_cases) - fake_count
        avg_sim    = round(sum(c["similarity"] for c in similar_cases) / len(similar_cases), 4)
        memory_context = {
            "matched_cases":   len(similar_cases),
            "fake_in_matches": fake_count,
            "real_in_matches": real_count,
            "avg_similarity":  avg_sim,
            "summary": f"Among {len(similar_cases)} similar past image(s): {fake_count} FAKE, {real_count} REAL (avg similarity {round(avg_sim*100,1)}%).",
            "cases":   similar_cases
        }

    top_zones = [r["zone"] for r in region_details[:3]]
    if is_fake and top_zones:
        technical_summary = f"Primary anomalies detected in: {', '.join(top_zones)}. These regions had the highest GradCAM activation relative to the fakeness signal."
    elif is_fake:
        technical_summary = "No dominant artifact region found. Anomaly signal appears distributed globally across the image."
    else:
        technical_summary = "Activations were diffuse and low-magnitude, consistent with a naturally photographed image."

    return {
        "verdict_summary":   verdict,
        "confidence_note":   confidence_note,
        "region_details":    region_details,
        "memory_context":    memory_context,
        "technical_summary": technical_summary
    }
