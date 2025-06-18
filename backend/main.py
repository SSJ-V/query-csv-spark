# fastapi_backend/main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
from langchain_ollama import ChatOllama
from langchain.agents import initialize_agent
from langchain.agents.agent_types import AgentType
from langchain_experimental.tools.python.tool import PythonAstREPLTool

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store uploaded DataFrame and agent
df = None
agent_executor = None

class Query(BaseModel):
    question: str

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    global df, agent_executor
    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode("utf-8")))

    # Setup REPL tool with DataFrame
    tools = [PythonAstREPLTool()]
    tools[0].globals = {"df": df}

    # Initialize LLM
    llm = ChatOllama(
        base_url="http://localhost:11434",
        model="llama3",
        temperature=0.1,
        api_key="ollama"
    )

    # Initialize agent
    agent_executor = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        agent_kwargs={
            "prefix": (
                "You are a data analyst AI with access to a pandas DataFrame called `df`, which contains the uploaded CSV file. "
                "Use Python code to analyze the data and answer the user's questions. Always use the tool to run code. "
                "Do not say you lack access—the data is local and you have permission to analyze it."
            ),
            "format_instructions": (
                "Use this format:\n\n"
                "Question: the input question\n"
                "Thought: your reasoning\n"
                "Action: python_repl_ast\n"
                "Action Input: Python code using df (e.g., df['runs'].mean())\n"
                "Observation: the result of the code\n"
                "...\n"
                "Final Answer: your final answer to the question"
            )
        },
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=20,
        max_execution_time=120,
    )

    return {"status": "success", "columns": df.columns.tolist(), "rows": len(df)}

@app.post("/ask")
async def ask_question(query: Query):
    global agent_executor
    if not agent_executor:
        return {"error": "No CSV uploaded or agent not initialized."}

    try:
        result = agent_executor.invoke({"input": query.question})
        return {"response": result["output"]}
    except Exception as e:
        return {"error": str(e)}