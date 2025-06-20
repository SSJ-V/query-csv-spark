from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import os
import re
import requests
import json

# === NVIDIA API Config ===

NVIDIA_API_KEY = "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"
NVIDIA_MODEL = "meta/llama-4-scout-17b-16e-instruct"
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

# === FastAPI Setup ===

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Global State ===

state = {
    "df": None,
    "csv_path": None,
}

# === Upload CSV ===

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    content = await file.read()

    os.makedirs("uploads", exist_ok=True)
    csv_path = os.path.join("uploads", file.filename)
    with open(csv_path, "wb") as f:
        f.write(content)

    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        return {"error": f"Failed to load CSV: {str(e)}"}

    if df.shape[1] == 0:
        return {"error": "Empty CSV"}

    state["df"] = df
    state["csv_path"] = csv_path

    print("\n=== CSV Uploaded ===")
    print(df.head())

    return {"status": "success", "columns": df.columns.tolist(), "rows": len(df)}

# === Query model ===

class Query(BaseModel):
    question: str

# === Custom RAG execution ===

@app.post("/ask")
async def ask_question(query: Query):
    if state["df"] is None:
        return {"error": "CSV not uploaded"}

    df = state["df"]

    # Build prompt manually:
    prompt = f"""
You are a pandas data analyst.
The dataframe is named 'df' and has the following columns: {list(df.columns)}.

Your ONLY task is to write Python pandas code using 'df' to answer the user's question.
DO NOT explain anything.
DO NOT write any text.
ONLY return Python code directly. No markdown. No triple backticks. No comments.

User Question: {query.question}
Python Code:
"""

    print(f"\n--- Prompt Sent ---\n{prompt}\n-------------------")

    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": NVIDIA_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
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
        code = result['choices'][0]['message']['content'].strip()

        print(f"\n--- LLM Generated Code ---\n{code}\n--------------------------")

    except Exception as e:
        return {"error": f"NVIDIA API Error: {str(e)}"}

    # Execute generated code safely
    try:
        local_vars = {"df": df.copy()}
        exec(f"result = {code}", {}, local_vars)
        output = local_vars["result"]
    except Exception as e:
        print(f"Execution error: {e}")
        return {"query": code, "final_answer": f"Execution Error: {str(e)}"}

    # Convert result to string
    if isinstance(output, pd.DataFrame):
        output_str = output.to_string()
    elif isinstance(output, pd.Series):
        output_str = output.to_string()
    else:
        output_str = str(output)

    return {"query": code, "final_answer": output_str}

# === Test route ===

@app.get("/")
def read_root():
    return {"status": "ok"}
