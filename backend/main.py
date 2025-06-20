from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
import requests
import re  # <-- (already added previously)
from csv_agent import CSVAgent

# === NVIDIA API CONFIG ===

NVIDIA_API_KEY = "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"
NVIDIA_MODEL = "meta/llama-4-scout-17b-16e-instruct"
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

# === FASTAPI SETUP ===

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === GLOBAL STATE ===

state = {
    "csv_path": None
}

# === CLEANING FUNCTION ===

def clean_llm_code(raw_code: str) -> str:
    # Remove any ```python ... ``` wrappers
    cleaned = re.sub(r"```.*?\n", "", raw_code, flags=re.DOTALL)
    cleaned = cleaned.replace("```", "").strip()

    # Remove print() wrapper if exists
    if cleaned.startswith("print(") and cleaned.endswith(")"):
        cleaned = cleaned[6:-1].strip()

    return cleaned

# === UPLOAD CSV ===

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    csv_path = os.path.join("uploads", file.filename)
    with open(csv_path, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        pd.read_csv(csv_path)
    except Exception as e:
        return {"error": f"Failed to load CSV: {str(e)}"}

    state["csv_path"] = csv_path
    return {"status": "success"}

# === QUERY MODEL ===

class Query(BaseModel):
    question: str

# === ASK ROUTE ===

@app.post("/ask")
async def ask_question(query: Query):
    if state["csv_path"] is None:
        return {"error": "CSV not uploaded"}

    try:
        df = pd.read_csv(state["csv_path"])
    except Exception as e:
        return {"error": f"Failed to read CSV: {str(e)}"}

    agent = CSVAgent(df)
    return agent.answer(query.question)

# === TEST ROUTE ===

@app.get("/")
def read_root():
    return {"status": "ok"}
