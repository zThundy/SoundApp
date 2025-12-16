
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
  name: "Green Template",
};

template.html = `<div id="container">
  <div id="header">G Twitch Chat</div>
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
  top: 1rem;
  left: 1rem;
  width: calc(100% - 2rem);
  height: calc(100% - 2rem);
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid rgba(70, 255, 101, 0.5);
  border-radius: 8px;
  overflow: hidden;
  backdrop-filter: blur(5px);
}

#header {
  padding: 10px 15px;
  background: linear-gradient(135deg, rgba(70, 255, 101, 0.6), rgba(0, 130, 17, 0.6));
  border-bottom: 1px solid rgba(70, 255, 79, 0.3);
  font-weight: bold;
  color: #fff;
  font-size: 2rem;
}

#messages {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.message {
  animation: slideIn 0.3s ease-out;
  font-size: 1.5rem;
  line-height: 1.3;
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
  margin-right: 5px;
  display: inline;
}

.message-text {
  color: #e0e0e0;
  word-wrap: break-word;
  display: inline;
}`

template.js = `onChatMessage = function(data) {
  // add any custom logic here
}`

export default template;
export type { ChatBoxTemplate };