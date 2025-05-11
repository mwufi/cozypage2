import os
from openai import OpenAI
from restate import Service, Context
from pydantic import BaseModel

client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)


ai = Service("AI")

class AIRequest(BaseModel):
    prompt: str

class AIResponse(BaseModel):
    response: str

@ai.handler()
async def generate_response(ctx: Context, req: AIRequest) -> AIResponse:
    response = client.responses.create(
        model="gpt-4o",
        instructions="You are a helpful assistant that can answer questions and help with tasks.",
        input=req.prompt,
    )

    return AIResponse(response=response.output_text)