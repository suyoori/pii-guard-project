from fastapi import FastAPI
from pydantic import BaseModel
import re
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextData(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_text(data: TextData):
    text = data.text
    original_text = text
    is_unsafe = False
    reasons = []

    # 터미널 로그 출력: 원본 텍스트 확인
    print(f"\n{'='*50}")
    print(f"[RAW INPUT]: {original_text}")

    # 1. 개인정보(PII) 탐지 및 마스킹 처리
    phone_pattern = r"010-\d{4}-\d{4}"
    email_pattern = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    jumin_pattern = r"\d{6}-\d{7}" 
    
    if re.search(phone_pattern, text):
        is_unsafe = True
        reasons.append("전화번호 유출")
        text = re.sub(phone_pattern, "[전화번호 보호됨]", text)
        
    if re.search(email_pattern, text):
        is_unsafe = True
        reasons.append("이메일 유출")
        text = re.sub(email_pattern, "[이메일 보호됨]", text)
        
    if re.search(jumin_pattern, text):
        is_unsafe = True
        reasons.append("주민등록번호 유출")
        text = re.sub(jumin_pattern, "[주민번호 보호됨]", text)
        
    # 2. 프롬프트 인젝션 방어
    cleaned_text = re.sub(r'[^a-zA-Z가-힣0-9]', '', original_text).lower()
    
    # 터미널 로그 출력: 정규화된 텍스트 확인 (방어 로직의 핵심)
    print(f"[NORMALIZED]: {cleaned_text}")
    
    injection_patterns = [
        "이전지시무시", "모든지시무시", "시스템프롬프트", "명령어무시", "프롬프트출력", "비밀번호알려줘",
        "ignoreall", "ignoreprevious", "systemprompt", "jailbreak", "forgetall", "bypasstherules"
    ]
    
    for pattern in injection_patterns:
        if pattern in cleaned_text:
            is_unsafe = True
            reasons.append("프롬프트 공격 시도")
            text = "[보안 위협으로 인해 입력이 차단되었습니다]"
            # 터미널 로그 출력: 공격 감지 확인
            print(f"[RESULT]: DETECTED ATTACK PATTERN -> '{pattern}'")
            break

    if not is_unsafe:
        print("[RESULT]: SAFE INPUT")
        
    print(f"{'='*50}\n")

    # 3. 결과와 함께 마스킹된 텍스트도 반환
    return {
        "is_unsafe": is_unsafe, 
        "message": ", ".join(reasons) if is_unsafe else "안전",
        "masked_text": text
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)