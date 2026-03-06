console.log("AI Guard: SafeInput 스크립트 대기 중...");

const DEFAULT_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
];
let allowedHosts = [...DEFAULT_HOSTS];
let autoReplace = true;
let previewEnabled = true;

// 1. 초기 설정값 불러오기
chrome.storage.sync.get(
  {
    allowedHosts: DEFAULT_HOSTS,
    autoReplace: true,
    previewEnabled: true,
  },
  (data) => {
    allowedHosts = Array.isArray(data.allowedHosts)
      ? data.allowedHosts
      : [...DEFAULT_HOSTS];
    autoReplace = data.autoReplace;
    previewEnabled = data.previewEnabled;
  }
);

// 2. 팝업창에서 스위치를 끄고 켤 때마다 실시간 업데이트
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    if (changes.allowedHosts) allowedHosts = changes.allowedHosts.newValue;
    if (changes.autoReplace) autoReplace = changes.autoReplace.newValue;
    if (changes.previewEnabled)
      previewEnabled = changes.previewEnabled.newValue;
  }
});

const isAllowedHost = () => {
  const currentHost = window.location.hostname;
  return allowedHosts.some(
    (host) => currentHost === host || currentHost.endsWith(`.${host}`)
  );
};

document.addEventListener("input", (event) => {
  if (!isAllowedHost()) return;

  const target = event.target;
  const editableElement =
    target.closest('[contenteditable="true"]') ||
    (target.tagName === "TEXTAREA" ? target : null);

  if (editableElement) {
    const text = editableElement.innerText || editableElement.value;

    if (text && text.length > 5) {
      checkSecurity(text, editableElement);
    } else {
      removePreview();
      editableElement.style.outline = "";
    }
  }
});

function checkSecurity(text, element) {
  chrome.runtime.sendMessage(
    { action: "analyzeText", text: text },
    (response) => {
      if (response && response.success && response.data) {
        if (response.data.is_unsafe) {
          element.style.outline = "3px solid red";
          element.style.borderRadius = "10px";

          // 미리보기 기능
          if (previewEnabled) {
            showPreview(element, response.data.masked_text);
          } else {
            removePreview();
          }

          // 자동 마스킹 덮어쓰기 기능
          if (autoReplace) {
            applyMasking(element, response.data.masked_text);
          }
        } else {
          element.style.outline = "";
          removePreview();
        }
      }
    }
  );
}

// 입력창 근처에 붉은색 경고 박스로 마스킹 결과를 보여주는 함수
function showPreview(element, maskedText) {
  let previewContainer = document.getElementById("fasoo-preview-box");
  if (!previewContainer) {
    previewContainer = document.createElement("div");
    previewContainer.id = "fasoo-preview-box";
    previewContainer.style.background = "#fee2e2";
    previewContainer.style.color = "#991b1b";
    previewContainer.style.padding = "8px 12px";
    previewContainer.style.borderRadius = "8px";
    previewContainer.style.fontSize = "13px";
    previewContainer.style.marginTop = "8px";
    previewContainer.style.zIndex = "9999";
    previewContainer.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    // 입력창 바로 다음 위치에 삽입
    element.insertAdjacentElement("afterend", previewContainer);
  }
  previewContainer.textContent = "보안 마스킹 미리보기: " + maskedText;
}

function removePreview() {
  const previewContainer = document.getElementById("fasoo-preview-box");
  if (previewContainer) {
    previewContainer.remove();
  }
}

// 사용자가 입력한 글자를 마스킹 처리된 안전한 글자로 강제 변경하는 함수
function applyMasking(element, maskedText) {
  if (element.tagName === "TEXTAREA") {
    if (element.value !== maskedText) {
      element.value = maskedText;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  } else if (element.isContentEditable) {
    if (element.innerText !== maskedText) {
      element.innerText = maskedText;
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
}
