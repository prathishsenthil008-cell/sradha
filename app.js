// --- FIREBASE SETUP ---
// IMPORT FIREBASE MODULES VIA CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 👇 YOUR FIREBASE CONFIGURATION GOES HERE 👇
// Replace this with the config from your Firebase Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyDwWESYBhzqiAgtGl-Cc1Y1WmMWyhpnrpw",
  authDomain: "sradharajiv-acfc9.firebaseapp.com",
  projectId: "sradharajiv-acfc9",
  storageBucket: "sradharajiv-acfc9.firebasestorage.app",
  messagingSenderId: "466188020051",
  appId: "1:466188020051:web:38b9108056df83c1a659a6",
  measurementId: "G-466KQ7RQ80"
};

let db = null;
let messagesCollection = null;

// Try to initialize Firebase, catch error if config is not set yet
try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        messagesCollection = collection(db, "messages");
        console.log("Firebase initialized successfully!");
    } else {
        console.warn("⚠️ Firebase is not configured yet! Chat will only work locally and won't save.");
    }
} catch (error) {
    console.error("Firebase init error:", error);
}

// --- UI LOGIC ---
const confessionScreen = document.getElementById('confession-screen');
const chatScreen = document.getElementById('chat-screen');
const startChatBtn = document.getElementById('start-chat-btn');

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessagesContainer = document.getElementById('chat-messages');

// For identifying who sent the message (Basic setup without authentication)
// In a real scenario you'd use Firebase Auth, but to keep it simple:
// We assign a random ID to this session. If it's your phone, it gets an ID. If it's hers, another ID.
let mySessionId = localStorage.getItem('sessionId');
if (!mySessionId) {
    mySessionId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', mySessionId);
}

// Switch Screens (Now directly calls the phone)
startChatBtn.addEventListener('click', () => {
    // This will instantly open the dialer and call the number
    window.location.href = "tel:9944293646";
});

// Call Buttons
document.querySelectorAll('.fake-call').forEach(btn => {
    btn.addEventListener('click', () => {
        // Triggers the phone to call the number
        window.location.href = "tel:9944293646";
    });
});

// Create Floating Hearts
function createHearts() {
    const containers = document.querySelectorAll('.hearts-bg');
    containers.forEach(container => {
        for (let i = 0; i < 15; i++) {
            let heart = document.createElement('div');
            heart.classList.add('heart-shape');
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.animationDuration = (Math.random() * 5 + 5) + 's';
            heart.style.animationDelay = (Math.random() * 5) + 's';
            container.appendChild(heart);
        }
    });
}

createHearts();

// --- CHAT LOGIC ---

// Send Message
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = ''; // Clear input

    if (db && messagesCollection) {
        // Send to Firebase
        try {
            await addDoc(messagesCollection, {
                text: text,
                senderId: mySessionId,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Failed to send message. Make sure Firestore rules allow reading/writing.");
        }
    } else {
        // Fallback: Just display locally if Firebase isn't configured
        displayMessage(text, mySessionId, new Date());
    }
});

// Listen for Messages from Firebase
function setupChatListener() {
    // We only want to set this up once
    if (chatMessagesContainer.dataset.listening) return;
    chatMessagesContainer.dataset.listening = "true";

    const q = query(messagesCollection, orderBy("createdAt", "asc"));
    
    onSnapshot(q, (snapshot) => {
        // Clear existing to prevent duplicates during re-renders, except system messages
        const sysMsg = chatMessagesContainer.querySelector('.system-message');
        chatMessagesContainer.innerHTML = '';
        if (sysMsg) chatMessagesContainer.appendChild(sysMsg);

        snapshot.forEach((doc) => {
            const data = doc.data();
            displayMessage(data.text, data.senderId, data.createdAt?.toDate());
        });
    });
}

// Display Message on UI
function displayMessage(text, senderId, dateObj) {
    const isMine = senderId === mySessionId;
    
    // Play sound if it's a new message
    if (dateObj && (new Date() - dateObj) < 5000) {
        if (isMine) document.getElementById('send-sound').play().catch(e => {});
        else document.getElementById('receive-sound').play().catch(e => {});
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMine ? 'sent' : 'received');

    const timeStr = dateObj ? dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
    const senderName = isMine ? 'Prathish ❤️' : 'Sradha 💖';

    messageDiv.innerHTML = `
        <p>${text}</p>
        <span class="msg-info">${senderName} • ${timeStr}</span>
    `;

    chatMessagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function scrollToBottom() {
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}
