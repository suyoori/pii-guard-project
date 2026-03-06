from typing import List

INJECTION_KEYWORDS: List[str] = [
    "ignore previous instructions",
    "ignore all previous instructions",
    "disregard above",
    "system prompt",
    "print the system prompt",
    "reveal the system prompt",
    "developer message",
    "you are chatgpt",
    "you are AI",
    "이전 지시 무시",
    "이전 지시를 무시",
    "지시를 무시",
    "시스템 프롬프트",
    "시스템 프롬프트 출력",
]


def detect_prompt_injection(text: str) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in INJECTION_KEYWORDS)
