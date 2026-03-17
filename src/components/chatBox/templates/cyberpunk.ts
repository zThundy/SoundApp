
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
  name: "Cyberpunk Neon",
};

template.html = `
<div id="particles"></div>
<div id="container">
  <div id="header">
    <div class="glow-text">
      <span class="icon">💬</span>
      LIVE CHAT
    </div>
    <div class="scan-line"></div>
  </div>
  <div id="messages"></div>
</div>
`;

template.css = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

html,
body {
  margin: 0;
  padding: 0;
  background: transparent;
  color: #000;
  font-family: 'Orbitron', system-ui, Arial, sans-serif;
  overflow: hidden;
}

#particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #00ffff;
  border-radius: 50%;
  box-shadow: 0 0 10px #00ffff;
  animation: float 4s infinite ease-in-out;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(50px);
    opacity: 0;
  }
}

#container {
  position: fixed;
  top: clamp(6px, 1.8vw, 16px);
  left: clamp(6px, 1.8vw, 16px);
  width: calc(100% - (clamp(6px, 1.8vw, 16px) * 2));
  height: calc(100% - (clamp(6px, 1.8vw, 16px) * 2));
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid #00ffff;
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.4),
    inset 0 0 40px rgba(0, 255, 255, 0.05);
  animation: borderPulse 3s infinite ease-in-out;
  z-index: 1;
}

@keyframes borderPulse {
  0%, 100% {
    box-shadow: 
      0 0 20px rgba(0, 255, 255, 0.4),
      inset 0 0 40px rgba(0, 255, 255, 0.05);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(255, 0, 255, 0.6),
      inset 0 0 60px rgba(255, 0, 255, 0.08);
    border-color: #ff00ff;
  }
}

.corner-decoration {
  position: absolute;
  width: 30px;
  height: 30px;
  border: 3px solid #00ffff;
  z-index: 2;
}

.corner-tl {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
  animation: cornerGlow 2s infinite ease-in-out;
}

.corner-tr {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
  animation: cornerGlow 2s infinite ease-in-out 0.5s;
}

.corner-bl {
  bottom: -2px;
  left: -2px;
  border-right: none;
  border-top: none;
  animation: cornerGlow 2s infinite ease-in-out 1s;
}

.corner-br {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
  animation: cornerGlow 2s infinite ease-in-out 1.5s;
}

@keyframes cornerGlow {
  0%, 100% {
    border-color: #00ffff;
    box-shadow: 0 0 5px #00ffff;
  }
  50% {
    border-color: #ff00ff;
    box-shadow: 0 0 15px #ff00ff;
  }
}

#header {
  position: relative;
  padding: clamp(10px, 2.3vw, 15px) clamp(10px, 3vw, 20px);
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(255, 0, 255, 0.15));
  border-bottom: 2px solid #00ffff;
  font-weight: 900;
  color: #fff;
  font-size: clamp(0.95rem, 4.2vw, 2rem);
  text-align: center;
  letter-spacing: clamp(1px, 0.8vw, 4px);
  overflow: hidden;
}

.scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ffff, transparent);
  animation: scan 3s infinite ease-in-out;
}

@keyframes scan {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.glow-text {
  text-shadow: 
    0 0 10px #00ffff,
    0 0 20px #00ffff,
    0 0 30px #00ffff,
    0 0 40px #ff00ff;
  animation: textGlow 2s infinite ease-in-out;
}

@keyframes textGlow {
  0%, 100% {
    text-shadow: 
      0 0 10px #00ffff,
      0 0 20px #00ffff,
      0 0 30px #00ffff,
      0 0 40px #ff00ff;
  }
  50% {
    text-shadow: 
      0 0 15px #ff00ff,
      0 0 25px #ff00ff,
      0 0 35px #ff00ff,
      0 0 45px #00ffff;
  }
}

.icon {
  display: inline-block;
  animation: pulse 1s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

#messages {
  flex: 1;
  padding: clamp(8px, 2vw, 15px);
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1.4vw, 12px);
  overflow: hidden;
  position: relative;
}

#messages::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    repeating-linear-gradient(
      0deg,
      rgba(0, 255, 255, 0.03) 0px,
      transparent 1px,
      transparent 2px,
      rgba(0, 255, 255, 0.03) 3px
    );
  pointer-events: none;
  animation: scanlines 8s linear infinite;
}

@keyframes scanlines {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(10px);
  }
}

.message {
  animation: messageEnter 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  font-size: clamp(0.85rem, 3.1vw, 1.5rem);
  line-height: 1.4;
  padding: clamp(8px, 1.8vw, 12px) clamp(10px, 2.3vw, 16px);
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.08), rgba(255, 0, 255, 0.08));
  border-left: 3px solid #00ffff;
  border-radius: 0 8px 8px 0;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.4em;
  justify-content: flex-start;
  align-items: flex-start;
}

.message::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes messageEnter {
  0% {
    opacity: 0;
    transform: translateX(-100px) rotateY(-90deg);
    filter: blur(10px);
  }
  60% {
    transform: translateX(10px) rotateY(0deg);
  }
  100% {
    opacity: 1;
    transform: translateX(0) rotateY(0deg);
    filter: blur(0);
  }
}

.username {
  font-weight: 700;
  margin-right: 0;
  display: inline-block;
  padding: clamp(3px, 0.9vw, 4px) clamp(8px, 1.8vw, 10px);
  font-size: clamp(0.72rem, 1.6vw, 1rem);
  border-radius: 6px;
  background: linear-gradient(135deg, #00ffff, #0088ff);
  color: #000;
  text-shadow: none;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  animation: usernameBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
}

.username::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent);
  transform: translate(-50%, -50%) scale(0);
  border-radius: 6px;
  animation: ping 2s infinite;
}

@keyframes ping {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

@keyframes usernameBounce {
  0% {
    transform: scale(0) rotate(-180deg);
  }
  60% {
    transform: scale(1.1) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.message-text {
  color: #e0e0e0;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: pre-line;
  display: inline;
  min-width: 0;
  text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
  animation: textFadeIn 0.8s ease-out 0.2s backwards;
}

.message-text .text,
.message-text .mention {
  white-space: pre-line;
}

@media (max-width: 640px) {
  #container {
    border-radius: 8px;
    border-width: 1px;
  }

  .message {
    border-left-width: 2px;
    border-radius: 0 6px 6px 0;
  }
}

@keyframes textFadeIn {
  0% {
    opacity: 0;
    filter: blur(5px);
  }
  100% {
    opacity: 1;
    filter: blur(0);
  }
}

/* Special message types */
.message.highlight {
  border-left-color: #ffff00;
  background: linear-gradient(90deg, rgba(255, 255, 0, 0.15), rgba(255, 165, 0, 0.15));
  animation: messageEnter 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), highlightFlash 1s ease-out;
}

@keyframes highlightFlash {
  0%, 100% {
    box-shadow: 0 0 0px rgba(255, 255, 0, 0);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 255, 0, 0.8);
  }
}

.message.moderator .username {
  background: linear-gradient(135deg, #00ff00, #00aa00);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.message.vip .username {
  background: linear-gradient(135deg, #ff00ff, #aa00ff);
  box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.message.subscriber .username {
  background: linear-gradient(135deg, #ff0000, #aa0000);
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}
`;

template.js = `
// Create floating particles
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;
  
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 4 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
    particlesContainer.appendChild(particle);
  }
}

// Initialize particles on load
setTimeout(createParticles, 100);

onChatMessage = function(data) {
  // Add custom logic for different message types
  const messageElement = document.querySelector('.message:last-child');
  
  if (!messageElement) return;
  
  // Add special classes based on user badges or message content
  if (data.badges && data.badges.includes('moderator')) {
    messageElement.classList.add('moderator');
  }
  
  if (data.badges && data.badges.includes('vip')) {
    messageElement.classList.add('vip');
  }
  
  if (data.badges && data.badges.includes('subscriber')) {
    messageElement.classList.add('subscriber');
  }
  
  // Highlight messages with mentions or special keywords
  if (data.message && (data.message.includes('@') || data.message.includes('!'))) {
    messageElement.classList.add('highlight');
  }
  
  // Create a burst effect for new messages
  createBurst(messageElement);
};

function createBurst(element) {
  const rect = element.getBoundingClientRect();
  const particlesContainer = document.getElementById('particles');
  
  for (let i = 0; i < 5; i++) {
    const burst = document.createElement('div');
    burst.style.position = 'absolute';
    burst.style.width = '4px';
    burst.style.height = '4px';
    burst.style.borderRadius = '50%';
    burst.style.background = Math.random() > 0.5 ? '#00ffff' : '#ff00ff';
    burst.style.left = rect.left + 'px';
    burst.style.top = rect.top + rect.height / 2 + 'px';
    burst.style.pointerEvents = 'none';
    burst.style.boxShadow = burst.style.background === '#00ffff' ? 
      '0 0 10px #00ffff' : '0 0 10px #ff00ff';
    
    const angle = (Math.PI * 2 * i) / 5;
    const velocity = 50 + Math.random() * 50;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    particlesContainer.appendChild(burst);
    
    let opacity = 1;
    let x = rect.left;
    let y = rect.top + rect.height / 2;
    
    const animate = () => {
      opacity -= 0.02;
      x += vx * 0.05;
      y += vy * 0.05;
      
      burst.style.left = x + 'px';
      burst.style.top = y + 'px';
      burst.style.opacity = opacity;
      
      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        burst.remove();
      }
    };
    
    requestAnimationFrame(animate);
  }
}
`

export default template;
export type { ChatBoxTemplate };