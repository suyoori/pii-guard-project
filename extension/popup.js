const DEFAULT_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
];

document.addEventListener("DOMContentLoaded", () => {
  const currentDomainSpan = document.getElementById("currentDomain");
  const allowCurrentButton = document.getElementById("allowCurrentButton");
  const statusText = document.getElementById("statusText");
  const hostList = document.getElementById("hostList");
  const autoReplaceToggle = document.getElementById("autoReplaceToggle");
  const previewToggle = document.getElementById("previewToggle");

  let allowedHosts = [];
  let activeHost = null;

  chrome.storage.sync.get(
    {
      allowedHosts: DEFAULT_HOSTS,
      autoReplace: true,
      previewEnabled: true,
    },
    (data) => {
      allowedHosts = data.allowedHosts;
      autoReplaceToggle.checked = data.autoReplace;
      previewToggle.checked = data.previewEnabled;
      renderHosts();
    }
  );

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        activeHost = url.hostname;
        currentDomainSpan.textContent = activeHost;
      } catch (e) {
        currentDomainSpan.textContent = "알 수 없는 사이트";
      }
    }
  });

  allowCurrentButton.addEventListener("click", () => {
    if (activeHost && !allowedHosts.includes(activeHost)) {
      allowedHosts.push(activeHost);
      saveSettings("사이트가 추가되었습니다.");
      renderHosts();
    } else {
      statusText.textContent = "이미 추가된 사이트입니다.";
      setTimeout(() => (statusText.textContent = ""), 2000);
    }
  });

  autoReplaceToggle.addEventListener("change", () =>
    saveSettings("설정이 저장되었습니다.")
  );
  previewToggle.addEventListener("change", () =>
    saveSettings("설정이 저장되었습니다.")
  );

  function renderHosts() {
    hostList.innerHTML = "";
    allowedHosts.forEach((host) => {
      const div = document.createElement("div");
      div.className = "host-item";
      div.textContent = "✔️ " + host;
      hostList.appendChild(div);
    });
  }

  function saveSettings(msg) {
    chrome.storage.sync.set(
      {
        allowedHosts: allowedHosts,
        autoReplace: autoReplaceToggle.checked,
        previewEnabled: previewToggle.checked,
      },
      () => {
        statusText.textContent = msg;
        setTimeout(() => (statusText.textContent = ""), 2000);
      }
    );
  }
});
