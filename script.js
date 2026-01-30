const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Cloudflare Worker endpoint (API)
const API_URL = "https://neurotech-match-bot.noemiamahmud.workers.dev";

let chatState = {
  messages: [],
  phase: "collecting", // collecting | done
};

function addBotMessage(text) {
  const msg = document.createElement("div");
  msg.className = "bot-message";
  msg.textContent = text;
  chat.appendChild(msg);
  scrollChat();
}

function addUserMessage(text) {
  const msg = document.createElement("div");
  msg.className = "user-message";
  msg.textContent = text;
  chat.appendChild(msg);
  scrollChat();
}

function scrollChat() {
  chat.scrollTop = chat.scrollHeight;
}

if (chat) startChat();

function startChat() {
  chat.innerHTML = "";
  chatState = { messages: [], phase: "collecting" };

  const opener =
    "Hi! I’ll help you find the best NeuroTech @ UIUC team. Share 2–3 interests (ex: EEG, ML, VR, writing/media, robotics, rehab research) and what you want to learn.";

  addBotMessage(opener);
  // keep minimal context for the model
  chatState.messages.push({ role: "assistant", content: opener });
}

sendBtn.addEventListener("click", handleUserInput);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleUserInput();
});

async function handleUserInput() {
  const text = input.value.trim();
  if (!text) return;

  // Manual reset after final result
  if (chatState.phase === "done") {
    const t = text.toLowerCase();
    if (t.includes("reset") || t.includes("start over") || t.includes("change")) {
      startChat();
      input.value = "";
      return;
    } else {
      addBotMessage('Type "reset" or "change my interests" to start over.');
      input.value = "";
      return;
    }
  }

  addUserMessage(text);
  input.value = "";

  chatState.messages.push({ role: "user", content: text });

  await callLLM();
}

async function callLLM() {
  sendBtn.disabled = true;
  input.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatState.messages }),
    });

    // helpful if something goes wrong
    if (!res.ok) {
      const errText = await res.text();
      console.error("Worker error:", res.status, errText);
      addBotMessage("Backend error (non-200). Try again in a moment.");
      return;
    }

    const data = await res.json();

    // Collecting mode: ask follow-up question
    if (data && data.ask && data.reset === false) {
      addBotMessage(data.ask);
      chatState.messages.push({ role: "assistant", content: data.ask });
      return;
    }

    // Final mode: team + why
    if (data && data.team && data.why && data.reset === true) {
      const finalMsg =
        `Best match: ${data.team}\n\n` +
        `Why: ${data.why}\n\n` +
        `If you'd like to start over, type "reset" or "change my interests".`;

      addBotMessage(finalMsg);
      chatState.phase = "done";
      return;
    }

    // Unexpected format
    console.warn("Unexpected response shape:", data);
    addBotMessage('Hmm—unexpected response. Try again, or type "reset".');
  } catch (err) {
    console.error(err);
    addBotMessage("Backend error. Try again in a moment.");
  } finally {
    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }
}
