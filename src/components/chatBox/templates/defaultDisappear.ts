
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
  name: "Default Template (disappearing messages)",
};

template.html = `<div id="messages"></div>
`;

template.css = `html,
body {
  margin: 0;
  padding: 0;
  background: transparent;
  color: #fff;
  font-family: system-ui, Arial, sans-serif;
  overflow: hidden;
}

#messages {
  position: fixed;
  inset: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
  overflow: hidden;
}

.message {
  font-size: 1.2rem;
  line-height: 1.4;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.username {
  font-weight: 600;
}

.message-text {
  color: #fff;
  word-wrap: break-word;
  display: inline;
}`

template.js = `const MESSAGE_TTL_MS = 5000;

onChatMessage = function() {
  const messageEl = document.querySelector('.message:last-child');
  if (!messageEl) return;

  setTimeout(() => {
    if (messageEl.parentElement) {
      messageEl.remove();
    }
  }, MESSAGE_TTL_MS);
}`

export default template;
export type { ChatBoxTemplate };