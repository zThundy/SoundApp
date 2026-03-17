
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
  name: "Simple chat",
};

template.html = `<div id="container">
  <div id="header">Chat</div>
  <div id="messages"></div>
</div>
`;

template.css = `html,
body {
  margin: 0;
  padding: 0;
  background: transparent;
  color: #000;
  font-family: system-ui, Arial, sans-serif;
}

#container {
  position: fixed;
  top: clamp(6px, 1.8vw, 16px);
  left: clamp(6px, 1.8vw, 16px);
  width: calc(100% - (clamp(6px, 1.8vw, 16px) * 2));
  height: calc(100% - (clamp(6px, 1.8vw, 16px) * 2));
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid rgba(145, 70, 255, 0.5);
  border-radius: 8px;
  overflow: hidden;
  backdrop-filter: blur(5px);
}

#header {
  padding: clamp(8px, 1.8vw, 10px) clamp(10px, 2.6vw, 15px);
  background: linear-gradient(135deg, rgba(145, 70, 255, 0.6), rgba(75, 0, 130, 0.6));
  border-bottom: 1px solid rgba(145, 70, 255, 0.3);
  font-weight: bold;
  color: #fff;
  font-size: clamp(1rem, 4.6vw, 2rem);
}

#messages {
  flex: 1;
  padding: clamp(8px, 2vw, 12px);
  display: flex;
  flex-direction: column;
  gap: clamp(5px, 1.1vw, 10px);
  overflow: hidden;
}

.message {
  animation: slideIn 0.3s ease-out;
  font-size: clamp(0.95rem, 3.2vw, 1.5rem);
  line-height: 1.3;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.35em;
  justify-content: flex-start;
  align-items: flex-start;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.username {
  font-weight: 600;
  margin-right: 0;
  display: inline;
}

.message-text {
  color: #e0e0e0;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: pre-line;
  display: inline;
  min-width: 0;
}

.message-text .text,
.message-text .mention {
  white-space: pre-line;
}

@media (max-width: 640px) {
  #container {
    border-radius: 6px;
    border-width: 1px;
  }
}
`;

template.js = `onChatMessage = function(data) {
  // add any custom logic here
}
`;

export default template;
export type { ChatBoxTemplate };