from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import requests

# === NVIDIA API CONFIG ===

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

# === Data Models ===

class UploadRequest(BaseModel):
    csv_content: str  # CSV file content as text

class QueryRequest(BaseModel):
    csv_content: str  # CSV file content again (always resend full CSV)
    question: str

# === Upload route (frontend still parses CSV file and sends its full text)

@app.post("/upload-csv")
async def upload_csv(req: UploadRequest):
    try:
        # Validate if CSV is correct
        df = pd.read_csv(io.StringIO(req.csv_content))
    except Exception as e:
        return {"error": f"Failed to parse CSV: {str(e)}"}

    # Just return column names for preview
    return {"status": "success", "columns": df.columns.tolist(), "rows": len(df)}

# === Ask route

@app.post("/ask")
async def ask_question(req: QueryRequest):
    try:
        df = pd.read_csv(io.StringIO(req.csv_content))
    except Exception as e:
        return {"error": f"Failed to parse CSV: {str(e)}"}

    # Build prompt
    prompt = f"""
You are a pandas data analyst.
The dataframe is named 'df' and has these columns: {list(df.columns)}.
ONLY write pandas code to answer the question. No explanation, no markdown.

User Question: {req.question}
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
        "temperature": 0.1
    }

    try:
        response = requests.post(NVIDIA_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        code = result['choices'][0]['message']['content'].strip()
        print(f"\nGenerated code:\n{code}\n")
    except Exception as e:
        return {"error": f"NVIDIA API Error: {str(e)}"}

    # Execute generated code safely
    try:
        local_vars = {"df": df.copy()}
        exec(f"result = {code}", {}, local_vars)
        output = local_vars["result"]
    except Exception as e:
        return {"query": code, "final_answer": f"Execution Error: {str(e)}"}

    if isinstance(output, pd.DataFrame):
        output_str = output.to_string()
    elif isinstance(output, pd.Series):
        output_str = output.to_string()
    else:
        output_str = str(output)

    return {"query": code, "final_answer": output_str}

# === Root health check
@app.get("/")
def read_root():
    return {"status": "ok"}
