from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import os
import re

from langchain_ollama import ChatOllama

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
    "llm": None
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

    # Build model only after CSV loaded
    state["llm"] = ChatOllama(
        base_url="http://localhost:11434",
        model="llama3",
        temperature=0.1,
        api_key="ollama"
    )

    return {"status": "success", "columns": df.columns.tolist(), "rows": len(df)}


# === Query model ===

class Query(BaseModel):
    question: str

# === Custom RAG execution ===

@app.post("/ask")
async def ask_question(query: Query):
    if state["df"] is None or state["llm"] is None:
        return {"error": "CSV not uploaded"}

    df = state["df"]
    llm = state["llm"]

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

    # Call LLM
    response = llm.invoke(prompt)
    code = response.content.strip()

    print(f"\n--- Generated Code ---\n{code}\n---------------------")

    # Execute code safely
    try:
        local_vars = {"df": df.copy()}
        exec(f"result = {code}", {}, local_vars)
        result = local_vars["result"]
    except Exception as e:
        print(f"Execution error: {e}")
        return {"query": code, "final_answer": f"Execution Error: {str(e)}"}

    # Convert result to string for display
    if isinstance(result, pd.DataFrame):
        output = result.to_string()
    elif isinstance(result, pd.Series):
        output = result.to_string()
    else:
        output = str(result)

    return {"query": code, "final_answer": output}


@app.get("/")
def read_root():
    return {"status": "ok"}
