
import os

from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class Agent:
    def __init__(self, name: str, system_message: str):
        self.name = name
        self.system_message = system_message

    def generate_response(self, message: str) -> str:
        return client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "system", "content": self.system_message},
                {"role": "user", "content": message},
            ],
        )