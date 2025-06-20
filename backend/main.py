from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import os
import requests
import re  # <-- (already added previously)

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

    # Build prompt
    prompt = f"""
You are a pandas data analyst.
The dataframe is named 'df' and has these columns: {list(df.columns)}.
ONLY write pandas code to answer the question. No explanation, no markdown, no triple backticks.

User Question: {query.question}
Python Code:
"""

    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": NVIDIA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 512,
        "temperature": 0.1,
        "top_p": 1.0,
        "frequency_penalty": 0.0,
        "presence_penalty": 0.0,
        "stream": False
    }

    try:
        response = requests.post(NVIDIA_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        raw_code = result['choices'][0]['message']['content'].strip()

        # Clean LLM code
        cleaned_code = clean_llm_code(raw_code)

        print(f"\n--- Raw LLM Output ---\n{raw_code}\n")
        print(f"--- Cleaned Code To Execute ---\n{cleaned_code}\n")

    except Exception as e:
        return {"error": f"NVIDIA API Error: {str(e)}"}

    # === UPDATED EXECUTION LOGIC ===
    try:
        local_vars = {"df": df.copy()}
        exec(cleaned_code, {}, local_vars)  # allow multi-line code block
        output = local_vars.get("result", "Code executed successfully. No direct result.")
    except Exception as e:
        return {"query": cleaned_code, "final_answer": f"Execution Error: {str(e)}"}

    # Convert result to string for frontend
    if isinstance(output, pd.DataFrame):
        output_str = output.to_string()
    elif isinstance(output, pd.Series):
        output_str = output.to_string()
    else:
        output_str = str(output)

    return {"query": cleaned_code, "final_answer": output_str}

# === TEST ROUTE ===

@app.get("/")
def read_root():
    return {"status": "ok"}
