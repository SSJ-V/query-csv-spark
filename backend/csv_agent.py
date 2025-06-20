import requests
import re
import pandas as pd

NVIDIA_API_KEY = "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"
NVIDIA_MODEL = "meta/llama-4-scout-17b-16e-instruct"
NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

class CSVAgent:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    @staticmethod
    def clean_llm_code(raw_code: str) -> str:
        cleaned = re.sub(r"```.*?\n", "", raw_code, flags=re.DOTALL)
        cleaned = cleaned.replace("```", "").strip()
        if cleaned.startswith("print(") and cleaned.endswith(")"):
            cleaned = cleaned[6:-1].strip()
        return cleaned

    def build_prompt(self, question: str) -> str:
        return f"""
You are a pandas data analyst.
The dataframe is named 'df' and has these columns: {list(self.df.columns)}.
Your ONLY task is to write Python pandas code to answer the user's question.
ALWAYS assign your answer to a variable named result. Do not print. Do not explain. Do not use markdown or triple backticks.

User Question: {question}
Python Code:
"""

    def call_llm(self, prompt: str) -> str:
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
        response = requests.post(NVIDIA_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content'].strip()

    def ensure_result_assignment(self, code: str) -> str:
        if 'result' not in code.split('=')[0]:
            lines = [line for line in code.splitlines() if line.strip()]
            if len(lines) == 1 and not lines[0].strip().startswith('result'):
                code = f"result = {lines[0]}"
            elif len(lines) > 1:
                if not lines[-1].strip().startswith('result'):
                    lines[-1] = f"result = {lines[-1]}"
                code = '\n'.join(lines)
        return code

    def summarize_answer(self, question: str, code: str, output: str) -> str:
        prompt = f"""
You are a data analyst assistant.
Given the following pandas code and its output, summarize the answer to the user's question in plain English.

User Question: {question}

Pandas Code:
{code}

Output:
{output}

Summary:
"""
        return self.call_llm(prompt)

    def answer(self, question: str):
        prompt = self.build_prompt(question)
        raw_code = self.call_llm(prompt)
        cleaned_code = self.clean_llm_code(raw_code)
        cleaned_code = self.ensure_result_assignment(cleaned_code)
        try:
            local_vars = {"df": self.df.copy()}
            exec(cleaned_code, {}, local_vars)
            output = local_vars.get("result", "Code executed successfully. No direct result.")
        except Exception as e:
            return {"query": cleaned_code, "final_answer": f"Execution Error: {str(e)}"}
        if isinstance(output, pd.DataFrame):
            output_str = output.to_string()
        elif isinstance(output, pd.Series):
            output_str = output.to_string()
        else:
            output_str = str(output)
        # Step 2: Summarize
        summary = self.summarize_answer(question, cleaned_code, output_str)
        return {
            "query": cleaned_code,
            "raw_output": output_str,
            "summary": summary.strip()
        } 