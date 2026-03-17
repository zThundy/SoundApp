
type ChatBoxTemplate = {
  html: string;
  css: string;
  js: string;
  name?: string;
};

const template: ChatBoxTemplate = {
  html: "",
  css: "",
  js: "",
  name: "Candy Pop",
};

template.html = `<div id="messages"></div>
`;

template.css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');

html,
body {
  margin: 0;
  padding: 0;
  background: transparent;
  color: #5a3f6f;
  font-family: 'Fredoka', system-ui, Arial, sans-serif;
  overflow: hidden;
}

#messages {
  position: fixed;
  inset: 0;
  padding: clamp(10px, 2.2vw, 18px) clamp(8px, 2vw, 16px);
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1.4vw, 10px);
  box-sizing: border-box;
  overflow: hidden;
  align-items: flex-start;
  justify-content: flex-start;
}

.message {
  position: relative;
  max-width: min(92vw, 86%);
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 1vw, 8px);
  align-items: flex-start;
  opacity: 0;
  transform: translateX(-60px);
  animation: slideInLeft 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.message.removing {
  animation: fadeOutUp 0.45s ease forwards;
}

.username {
  display: inline-block;
  padding: clamp(3px, 0.8vw, 4px) clamp(8px, 1.8vw, 10px) clamp(2px, 0.7vw, 3px);
  font-size: clamp(0.75rem, 1.8vw, 0.95rem);
  font-weight: 700;
  color: #ffffff !important;
  background: linear-gradient(90deg, #c665e3 0%, #f07bd5 100%);
  border: 2px solid #a653c8;
  border-radius: 999px;
  box-shadow: 0 2px 0 rgba(166, 83, 200, 0.35), 0 4px 12px rgba(145, 65, 170, 0.25);
  text-transform: lowercase;
}

.message-text {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: clamp(8px, 1.8vw, 10px) clamp(10px, 2.4vw, 14px);
  font-size: clamp(0.85rem, 2vw, 1.05rem);
  line-height: 1.35;
  color: #5a3f6f;
  background: #ffffff;
  border: 2px solid #d174e8;
  border-radius: 14px;
  box-shadow: 0 6px 0 rgba(215, 111, 232, 0.35), 0 10px 18px rgba(96, 39, 114, 0.15);
  word-wrap: break-word;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: pre-line;
}

.message-text .text,
.message-text .mention {
  white-space: pre-line;
}

.message-text .mention {
  padding: 2px 6px;
  border-radius: 10px;
  background: #ffe2f5;
  color: #b25bd7;
  font-weight: 700;
}

.message-text .text {
  color: #5a3f6f;
}

.message-text .emote {
  width: clamp(18px, 4.2vw, 26px);
  height: clamp(18px, 4.2vw, 26px);
  object-fit: contain;
}

@media (max-width: 640px) {
  .message {
    max-width: 100%;
  }

  .message-text {
    border-width: 1px;
    border-radius: 10px;
  }
}

@keyframes slideInLeft {
  0% {
    opacity: 0;
    transform: translateX(-60px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeOutUp {
  0% {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateX(0) translateY(-16px);
  }
}
`;

template.js = `const MESSAGE_TTL_MS = 10000;
const REMOVE_ANIMATION_MS = 450;

onChatMessage = function() {
  const messageEl = document.querySelector('.message:last-child');
  if (!messageEl) return;

  setTimeout(() => {
    if (!messageEl.parentElement) return;

    messageEl.classList.add('removing');

    setTimeout(() => {
      if (messageEl.parentElement) {
        messageEl.remove();
      }
    }, REMOVE_ANIMATION_MS);
  }, MESSAGE_TTL_MS);
};`;

export default template;
export type { ChatBoxTemplate };
