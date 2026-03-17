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
  name: "Sliding Messages",
};

template.html = `
<div id="messages"></div>
`;

template.css = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

html,
body {
  margin: 0;
  padding: 0;
  background: transparent;
  font-family: 'Poppins', system-ui, Arial, sans-serif;
  overflow: hidden;
}

#messages {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: clamp(10px, 3vw, 40px);
  gap: clamp(6px, 1.2vw, 12px);
  overflow: hidden;
  box-sizing: border-box;
}

.message {
  animation: slideInFromRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 0s;
  padding: 12px 18px;
  background: #ffffff;
  border-left: 4px solid #667eea;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  width: min(100%, 46rem);
  max-width: min(92vw, 46rem);
  word-wrap: break-word;
  font-size: clamp(0.85rem, 1.8vw, 1.1rem);
  line-height: 1.4;
  opacity: 0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.35em;
  justify-content: flex-start;
  align-items: flex-start;
}

@keyframes slideInFromRight {
  0% {
    opacity: 0;
    transform: translateX(600px) scale(0.8);
  }
  60% {
    transform: translateX(-10px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes fadeOutSlideRight {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  40% {
    transform: translateX(-10px) scale(1.02);
  }
  100% {
    opacity: 0;
    transform: translateX(600px) scale(0.8);
  }
}

.message.removing {
  animation: fadeOutSlideRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.username {
  font-weight: 700;
  margin-right: 0;
  display: inline-block;
  font-size: 1.05em;
  flex: 0 0 auto;
}

.message-text {
  color: #111827;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: pre-line;
  display: inline;
  min-width: 0;
  flex: 1 1 auto;
}

.message-text .text,
.message-text .mention {
  white-space: pre-line;
}

@media (max-width: 640px) {
  .message {
    border-left-width: 3px;
    border-radius: 6px;
    padding: 10px 12px;
  }
}

/* Special message types */
.message.moderator {
  background: #ffffff;
  border-left-color: #0f9b0f;
}

.message.moderator .username {
  color: #0f9b0f;
}

.message.vip {
  background: #ffffff;
  border-left-color: #ff6b6b;
}

.message.vip .username {
  color: #ff6b6b;
}

.message.subscriber {
  background: #ffffff;
  border-left-color: #a8edea;
}

.message.subscriber .username {
  color: #a8edea;
}
`;

template.js = `
let messageCount = 0;
const MAX_VISIBLE_MESSAGES = 8;
const MESSAGE_DISPLAY_TIME = 8000; // Display message for 8 seconds

const messageTimers = new Map(); // Track timers for each message element

function hexToRgb(hex) {
  // Handle #RRGGBB format
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 102, g: 126, b: 234 }; // Default color if parsing fails
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

function isWhiteOrCloseToWhite(hex) {
  const rgb = hexToRgb(hex);
  // Check if all RGB values are above 200 (close to white)
  return rgb.r > 200 && rgb.g > 200 && rgb.b > 200;
}

function removeOldestMessage() {
  const messagesContainer = document.getElementById('messages');
  const messages = messagesContainer.querySelectorAll('.message:not(.removing)');
  
  if (messages.length > 0) {
    const oldestMessage = messages[0];
    clearTimeout(messageTimers.get(oldestMessage));
    messageTimers.delete(oldestMessage);
    oldestMessage.classList.add('removing');
    
    setTimeout(() => {
      if (oldestMessage.parentElement) {
        oldestMessage.remove();
      }
    }, 500);
  }
}

function scheduleMessageRemoval(messageElement) {
  // Clear any existing timer for this message
  if (messageTimers.has(messageElement)) {
    clearTimeout(messageTimers.get(messageElement));
  }
  
  // Set new timer
  const timer = setTimeout(() => {
    messageTimers.delete(messageElement);
    messageElement.classList.add('removing');
    
    setTimeout(() => {
      if (messageElement.parentElement) {
        messageElement.remove();
      }
    }, 500);
  }, MESSAGE_DISPLAY_TIME);
  
  messageTimers.set(messageElement, timer);
}

onChatMessage = function(data) {
  const messagesContainer = document.getElementById('messages');
  const messageEl = messagesContainer.querySelector('.message:last-child');
  
  if (!messageEl) return;
  
  // Set border color based on username color
  const userColor = data.color || '#667eea';
  const displayColor = isWhiteOrCloseToWhite(userColor) ? '#6b7280' : userColor;
  messageEl.style.borderLeftColor = displayColor;
  
  // Apply username color (use gray if color is white or close to white)
  const usernameEl = messageEl.querySelector('.username');
  if (usernameEl) {
    usernameEl.style.color = displayColor;
  }
  
  // Schedule removal
  scheduleMessageRemoval(messageEl);
  
  // Remove oldest message if we exceed max visible
  const visibleMessages = messagesContainer.querySelectorAll('.message:not(.removing)');
  if (visibleMessages.length > MAX_VISIBLE_MESSAGES) {
    removeOldestMessage();
  }
  
  // Add special classes based on badges
  if (data.badges) {
    if (data.badges.includes('moderator')) {
      messageEl.classList.add('moderator');
    }
    
    if (data.badges.includes('vip')) {
      messageEl.classList.add('vip');
    }
    
    if (data.badges.includes('subscriber')) {
      messageEl.classList.add('subscriber');
    }
  }
};
`;

export default template;
export type { ChatBoxTemplate };
