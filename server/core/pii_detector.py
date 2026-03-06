import re
from typing import Tuple

EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_PATTERN = re.compile(
    r"\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{4}\b"
)
KOREAN_RRN_PATTERN = re.compile(r"\b\d{6}-?[1-4]\d{6}\b")
KOREAN_ROAD_ADDRESS_PATTERN = re.compile(
    r"\b[가-힣0-9\s-]{2,}(로|길)\s?\d{1,4}(-\d{1,4})?\b"
)
KOREAN_LOT_ADDRESS_PATTERN = re.compile(
    r"\b[가-힣0-9\s-]{2,}(동|읍|면|리)\s?\d{1,4}(-\d{1,4})?\b"
)

PII_PATTERNS = [
    EMAIL_PATTERN,
    PHONE_PATTERN,
    KOREAN_RRN_PATTERN,
    KOREAN_ROAD_ADDRESS_PATTERN,
    KOREAN_LOT_ADDRESS_PATTERN,
]


def mask_pii(text: str) -> Tuple[str, bool]:
    masked = text
    for pattern in PII_PATTERNS:
        masked = pattern.sub("[MASKED_DATA]", masked)
    has_pii = masked != text
    return masked, has_pii
