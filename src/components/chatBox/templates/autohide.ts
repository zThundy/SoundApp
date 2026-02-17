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
  name: "Auto-Hide Chat",
};

template.html = `
<div id="chat-icon" class="collapsed">
  <div class="icon-wrapper">
    <div class="chat-bubble">
      <span class="bubble-dot"></span>
      <span class="bubble-dot"></span>
      <span class="bubble-dot"></span>
    </div>
    <div class="notification-badge">0</div>
  </div>
</div>
<div id="container" class="hidden">
  <div id="header">
    <div class="header-content">
      <span class="chat-icon-emoji">💬</span>
      <span class="title">Live Chat</span>
    </div>
  </div>
  <div id="messages"></div>
</div>
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

/* Chat Icon Styles */
#chat-icon {
  position: fixed;
  top: 2rem;
  left: 50%;
  width: 100px;
  height: 100px;
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 1000;
  pointer-events: none;
}

#chat-icon.collapsed {
  transform: translateX(-50%) scale(1);
  opacity: 1;
  pointer-events: all;
}

#chat-icon.hidden {
  transform: translateX(-50%) scale(0);
  opacity: 0;
}

.icon-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.chat-bubble {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 
    0 10px 40px rgba(102, 126, 234, 0.6),
    0 0 0 0 rgba(102, 126, 234, 0.7);
  animation: iconPulse 2s infinite;
  transition: all 0.3s ease;
}

@keyframes iconPulse {
  0% {
    box-shadow: 
      0 10px 40px rgba(102, 126, 234, 0.6),
      0 0 0 0 rgba(102, 126, 234, 0.7);
  }
  50% {
    box-shadow: 
      0 10px 40px rgba(102, 126, 234, 0.6),
      0 0 0 15px rgba(102, 126, 234, 0);
  }
  100% {
    box-shadow: 
      0 10px 40px rgba(102, 126, 234, 0.6),
      0 0 0 0 rgba(102, 126, 234, 0.7);
  }
}

.bubble-dot {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  animation: dotBounce 1.4s infinite ease-in-out;
}

.bubble-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.bubble-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.notification-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  min-width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  padding: 0 10px;
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.6);
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.notification-badge.show {
  opacity: 1;
  transform: scale(1);
}

.notification-badge.new-message {
  animation: badgePop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes badgePop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* Container Styles */
#container {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 70%;
  max-width: 900px;
  height: 70%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.9);
  overflow: hidden;
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-origin: center center;
  z-index: 999;
}

#container.hidden {
  transform: translate(-50%, -50%) scale(0.1);
  opacity: 0;
}

#container.visible {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

/* Header Styles */
#header {
  padding: 25px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 3px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px 24px 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

#header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: headerShine 3s infinite;
}

@keyframes headerShine {
  0%, 100% {
    transform: translate(-50%, -50%);
  }
  50% {
    transform: translate(0%, 0%);
  }
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  font-weight: 700;
  font-size: 2rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  letter-spacing: 2px;
}

.chat-icon-emoji {
  font-size: 2.5rem;
  animation: iconFloat 2s infinite ease-in-out;
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

/* Messages Styles */
#messages {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

#messages::-webkit-scrollbar {
  width: 8px;
}

#messages::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

#messages::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

#messages::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.message {
  animation: messageSlideIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  font-size: 1.5rem;
  line-height: 1.5;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform-origin: left center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.message:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  transform: translateX(5px);
}

.message::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message:hover::before {
  opacity: 1;
}

@keyframes messageSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-50px) scale(0.8);
  }
  60% {
    transform: translateX(10px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.username {
  font-weight: 700;
  margin-right: 8px;
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.username::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.message:hover .username::after {
  width: 100%;
}

.message-text {
  color: #333;
  word-wrap: break-word;
  display: inline;
}

/* Special message types */
.message.moderator {
  background: linear-gradient(145deg, #d4fc79 0%, #96e6a1 100%);
}

.message.moderator .username {
  background: linear-gradient(135deg, #0f9b0f 0%, #00b09b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.message.vip {
  background: linear-gradient(145deg, #ffecd2 0%, #fcb69f 100%);
}

.message.vip .username {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.message.subscriber {
  background: linear-gradient(145deg, #e0c3fc 0%, #8ec5fc 100%);
}

.message.subscriber .username {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Auto-hide animation */
#container.auto-hiding {
  animation: slideDownOut 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

@keyframes slideDownOut {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(-100%) scale(0.3);
    opacity: 0;
  }
}
`;

template.js = `
let messageCount = 0;
let hideTimeout = null;
let isExpanded = false;
const HIDE_DELAY = 5000; // Hide after 5 seconds of no new messages
const SHOW_DURATION = 3000; // Show icon for 3 seconds when collapsed

// Initialize
function init() {
  // Start collapsed
  collapseChat(true);
}

function expandChat() {
  const chatIcon = document.getElementById('chat-icon');
  const container = document.getElementById('container');
  const badge = document.querySelector('.notification-badge');
  
  isExpanded = true;
  chatIcon.classList.remove('collapsed');
  chatIcon.classList.add('hidden');
  container.classList.remove('hidden', 'auto-hiding');
  container.classList.add('visible');
  
  // Reset message count and hide badge
  messageCount = 0;
  badge.textContent = '0';
  badge.classList.remove('show', 'new-message');
  
  // Clear any existing timeout
  clearTimeout(hideTimeout);
  
  // Set new auto-hide timeout
  resetHideTimer();
}

function collapseChat(immediate = false) {
  const chatIcon = document.getElementById('chat-icon');
  const container = document.getElementById('container');
  
  isExpanded = false;
  
  if (immediate) {
    container.classList.add('hidden');
    container.classList.remove('visible');
    chatIcon.classList.add('collapsed');
    chatIcon.classList.remove('hidden');
  } else {
    container.classList.add('auto-hiding');
    
    setTimeout(() => {
      container.classList.remove('auto-hiding', 'visible');
      container.classList.add('hidden');
      chatIcon.classList.add('collapsed');
      chatIcon.classList.remove('hidden');
    }, 800);
  }
  
  // Clear auto-hide timeout
  clearTimeout(hideTimeout);
}

function resetHideTimer() {
  clearTimeout(hideTimeout);
  
  if (isExpanded) {
    hideTimeout = setTimeout(() => {
      collapseChat();
    }, HIDE_DELAY);
  }
}

function updateBadge() {
  const badge = document.querySelector('.notification-badge');
  
  if (!isExpanded && messageCount > 0) {
    badge.textContent = messageCount > 99 ? '99+' : messageCount.toString();
    badge.classList.add('show', 'new-message');
    
    // Remove animation class after it completes
    setTimeout(() => {
      badge.classList.remove('new-message');
    }, 600);
  }
}

onChatMessage = function(data) {
  // Always expand chat when new message arrives
  if (!isExpanded) {
    expandChat();
  } else {
    // Reset hide timer when new message arrives while expanded
    resetHideTimer();
  }
  
  // Add special classes based on user badges
  setTimeout(() => {
    const messageElement = document.querySelector('.message:last-child');
    
    if (!messageElement) return;
    
    if (data.badges) {
      if (data.badges.includes('moderator')) {
        messageElement.classList.add('moderator');
      }
      
      if (data.badges.includes('vip')) {
        messageElement.classList.add('vip');
      }
      
      if (data.badges.includes('subscriber')) {
        messageElement.classList.add('subscriber');
      }
    }
  }, 50);
};

// Initialize on load
setTimeout(init, 100);
`;

export default template;
export type { ChatBoxTemplate };
