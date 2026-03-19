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
  name: "Default Template",
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
  padding: clamp(8px, 2vw, 14px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(4px, 1vw, 8px);
  box-sizing: border-box;
  overflow: hidden;
}

.message {
  font-size: clamp(0.85rem, 2.1vw, 1.2rem);
  line-height: 1.4;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  text-align: left;
  gap: 6px;
}

.username {
  font-weight: 600;
  text-align: left;
}

.message-text {
  color: #fff;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: pre-line;
  display: inline;
  text-align: left;
}

.message-text .text,
.message-text .mention {
  white-space: pre-line;
}
`;

template.js = ``

export default template;
export type { ChatBoxTemplate };
