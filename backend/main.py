from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn
import uuid
import os
import json
import shutil
from pathlib import Path

from inference import run_inference

app = FastAPI(title="Deepfake Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RESULTS_DIR = Path("results")
RESULTS_DIR.mkdir(exist_ok=True)

# Serve result images statically
app.mount("/results", StaticFiles(directory="results"), name="results")


@app.get("/")
def root():
    return {"status": "Deepfake Detector API running"}


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    run_id = str(uuid.uuid4())
    run_dir = RESULTS_DIR / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    # Save uploaded image
    original_path = run_dir / "original.jpg"
    with open(original_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        result = run_inference(str(original_path), str(run_dir), run_id)
        return JSONResponse(content=result)
    except Exception as e:
        shutil.rmtree(run_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


@app.get("/history")
def get_history():
    """Return list of all past analyses."""
    history = []
    for run_dir in sorted(RESULTS_DIR.iterdir(), reverse=True):
        result_file = run_dir / "result.json"
        if result_file.exists():
            with open(result_file) as f:
                history.append(json.load(f))
    return {"history": history}


@app.get("/result/{run_id}")
def get_result(run_id: str):
    result_file = RESULTS_DIR / run_id / "result.json"
    if not result_file.exists():
        raise HTTPException(status_code=404, detail="Result not found.")
    with open(result_file) as f:
        return json.load(f)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
