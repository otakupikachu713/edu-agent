# backend/app/routes/chat.py
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI

router = APIRouter(prefix="/chat", tags=["chat"])

_client: AsyncOpenAI | None = None

def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(500, "OPENAI_API_KEY not set")
        _client = AsyncOpenAI(api_key=api_key)
    return _client


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str = "gpt-4o-mini"


@router.post("/stream")
async def chat_stream(req: ChatRequest):
    client = get_client()

    async def event_generator():
        try:
            stream = await client.chat.completions.create(
                model=req.model,
                messages=[m.model_dump() for m in req.messages],
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield f"data: {delta}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )