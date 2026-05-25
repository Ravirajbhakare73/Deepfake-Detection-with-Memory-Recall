# Ambiguity-Aware Deepfake Image Detection Using StyleGAN2-ADA and CNN with Memory-Guided Recall

## One-Line Summary
A CNN-based deepfake image detection system enhanced with StyleGAN2-ADA generated samples and a memory-guided recall mechanism to improve classification in ambiguous cases.

---

# Overview

This project focuses on detecting deepfake facial images using a Convolutional Neural Network (CNN) trained from scratch. Real facial images are collected from the FFHQ dataset, while fake images are generated using StyleGAN2-ADA. 

To improve performance in visually ambiguous cases, a memory-guided recall mechanism is introduced. The system compares feature embeddings of the current image with previously stored embeddings and utilizes similarity-based retrieval to support more reliable classification.

The project also integrates Grad-CAM visualization for interpretability by highlighting important regions influencing the prediction.

---

# Problem Statement

Deepfake images are becoming increasingly realistic due to advances in generative AI models. Traditional CNN-based classifiers often struggle in cases where the visual difference between real and fake images is minimal.

This project aims to address:
- Ambiguity in deepfake detection
- Misclassification in borderline samples
- Lack of interpretability in CNN predictions

The proposed solution combines:
- CNN-based feature extraction
- StyleGAN2-ADA synthetic image generation
- Memory-guided feature recall
- Grad-CAM visualization

to improve robustness and explainability.

---

# Dataset

## Real Images
Real facial images are taken from the FFHQ dataset:

Dataset Link:  
https://www.kaggle.com/datasets/arnaud58/flickrfaceshq-dataset-ffhq

## Fake Images
Fake images are generated using a custom StyleGAN2-ADA based generation pipeline.

## Dataset Details
- Total Real Images: 50,000
- Total Fake Images: 50,000
- Total Dataset Size: 100,000 images

For training:
- Around 60,000 samples are randomly selected during training
- Random sampling is performed during each epoch to improve generalization and reduce overfitting

---

# Tools and Technologies

## Programming Language
- Python

## Deep Learning Frameworks
- TensorFlow
- Keras

## GAN Framework
- StyleGAN2-ADA

## Visualization
- Grad-CAM
- Matplotlib

## Backend
- FastAPI

## Frontend
- React.js

## Other Libraries
- NumPy
- OpenCV
- Scikit-learn
- FAISS (optional memory retrieval optimization)

---

# Project Structure

```bash
project/
│
├── backend/
│   ├── main.py
│   ├── inference.py
│   ├── model_loader.py
│   ├── gradcam.py
│   ├── memory.py
│   ├── explainer.py
│   ├── requirements.txt
│   ├── model/
│   └── results/
│
├── memory_store/
│
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│
├── README.md
│
└── dataset/
```

---

# How the System Works

## Step 1 — Image Input
The uploaded facial image is preprocessed and resized.

## Step 2 — CNN Feature Extraction
The CNN extracts feature embeddings from the image.

## Step 3 — Memory Recall
The extracted embedding is compared with stored embeddings using cosine similarity.

## Step 4 — Feature Aggregation
Top-k similar embeddings are aggregated to create a memory representation.

## Step 5 — Feature Fusion
The current embedding and memory embedding are fused to create an enhanced feature vector.

## Step 6 — Final Prediction
The enhanced feature vector is passed to the classifier for final real/fake prediction.

## Step 7 — Explainability
Grad-CAM heatmaps highlight the image regions influencing the prediction.

---

# How to Run the Project

## Step 1 — Clone Repository

```bash
git clone <repository-link>
cd project
```

---

## Step 2 — Backend Setup

```bash
cd backend

python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Step 3 — Add Model Files

Place trained model files inside:

```bash
backend/model/
```

---

## Step 4 — Run Backend

```bash
python main.py
```

Backend will run on:

```bash
http://localhost:8000
```

---

## Step 5 — Frontend Setup

```bash
cd frontend

npm install
npm start
```

Frontend will run on:

```bash
http://localhost:3000
```

---

# Features

- CNN-based deepfake detection
- StyleGAN2-ADA fake image generation
- Memory-guided recall mechanism
- Similarity-based feature retrieval
- Grad-CAM explainability
- Ambiguity-aware classification
- Real/Fake prediction confidence visualization

---

# Results

The proposed model achieves stable classification performance on ambiguous deepfake samples while improving interpretability through Grad-CAM visualization and memory-guided feature retrieval.

---

# Future Scope

- Integration of EfficientNet or Vision Transformers
- Larger-scale memory optimization
- Real-time video deepfake detection
- Cross-dataset generalization
- Attention-based feature fusion mechanisms

---

# Authors

Developed as a research-oriented deepfake detection system focused on ambiguity-aware classification and explainable AI techniques.
