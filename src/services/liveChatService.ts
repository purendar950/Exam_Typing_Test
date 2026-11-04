/**
 * Real-Time Live Support Chat Service
 * Enables candidates to chat directly with Administrators through an on-website widget.
 *
 * Architecture:
 * 1. Messages are synced in real-time via Cloud Firestore (support_chats collection).
 * 2. When a candidate sends a message, a notification is instantly dispatched to the
 *    Admin's Telegram bot with candidate details and a 1-click link to open the conversation.
 * 3. Admin replies from the website's Admin Suite (or 1-click link), and the candidate
 *    receives the reply live via Firestore onSnapshot listener.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { db, UserProfile } from './firebase';
import { getTelegramConfig } from './telegramService';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName: string;
  text: string;
  timestamp: string; // ISO string
}

export interface SupportChatSession {
  id: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  status: 'open' | 'closed';
  lastMessage: string;
  lastMessageAt: string;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  messages: ChatMessage[];
  createdAt: string;
}

const STORAGE_KEY_CHAT_SESSION = 'up_support_chat_session_id';

// 1. Get or Create Session for current browser / user
export async function getOrCreateChatSession(currentUser?: UserProfile | null): Promise<SupportChatSession> {
  let sessionId = localStorage.getItem(STORAGE_KEY_CHAT_SESSION);

  if (sessionId) {
    try {
      const snap = await getDoc(doc(db, 'support_chats', sessionId));
      if (snap.exists()) {
        const data = snap.data() as SupportChatSession;
        // Update user profile info if changed
        if (currentUser && (!data.userId || data.userName === 'Guest Candidate')) {
          const updatedName = currentUser.displayName || data.userName;
          const updatedEmail = currentUser.email || data.userEmail;
          await updateDoc(doc(db, 'support_chats', sessionId), {
            userId: currentUser.uid,
            userName: updatedName,
            userEmail: updatedEmail
          });
          data.userId = currentUser.uid;
          data.userName = updatedName;
          data.userEmail = updatedEmail;
        }
        return data;
      }
    } catch (err) {
      console.warn('Failed to load existing chat session from Firestore:', err);
    }
  }

  // Create new session
  sessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  localStorage.setItem(STORAGE_KEY_CHAT_SESSION, sessionId);

  const initialSession: SupportChatSession = {
    id: sessionId,
    userId: currentUser?.uid,
    userName: currentUser?.displayName || 'Candidate',
    userEmail: currentUser?.email || '',
    status: 'open',
    lastMessage: 'Chat started',
    lastMessageAt: new Date().toISOString(),
    unreadByAdmin: false,
    unreadByUser: false,
    messages: [
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'admin',
        senderName: 'Exam Typing Helpdesk',
        text: '👋 Namaste! Welcome to Exam Typing Support Desk. How can we help you today with your exams, typing tests, or Pro pass?',
        timestamp: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'support_chats', sessionId), initialSession);
  } catch (err) {
    console.warn('Failed to save initial chat session to Firestore:', err);
  }

  return initialSession;
}

// 2. Real-Time Listener for a specific chat session (used by candidate widget)
export function subscribeToChatSession(
  sessionId: string,
  onUpdate: (session: SupportChatSession | null) => void
): () => void {
  try {
    const unsub = onSnapshot(
      doc(db, 'support_chats', sessionId),
      (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as SupportChatSession);
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.warn('Live chat onSnapshot error:', err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('Failed to subscribe to chat session:', err);
    return () => {};
  }
}

// 3. Send message from Candidate to Admin
export async function sendUserLiveMessage(
  sessionId: string,
  text: string,
  userName: string,
  userEmail?: string
): Promise<boolean> {
  const cleanText = text.trim();
  if (!cleanText) return false;

  const now = new Date().toISOString();
  const newMessage: ChatMessage = {
    id: `msg_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: 'user',
    senderName: userName || 'Candidate',
    text: cleanText,
    timestamp: now
  };

  try {
    // 1. Update Firestore
    const ref = doc(db, 'support_chats', sessionId);
    await updateDoc(ref, {
      messages: arrayUnion(newMessage),
      lastMessage: cleanText,
      lastMessageAt: now,
      unreadByAdmin: true,
      unreadByUser: false,
      status: 'open',
      userName: userName || 'Candidate',
      userEmail: userEmail || ''
    });

    // 2. Dispatch Telegram Alert to Admin
    notifyAdminViaTelegram(sessionId, userName, userEmail, cleanText).catch((err) => {
      console.warn('Failed to dispatch live chat Telegram alert:', err);
    });

    return true;
  } catch (err) {
    console.error('Error sending user message:', err);
    return false;
  }
}

// 4. Send reply from Admin to Candidate
export async function sendAdminLiveReply(
  sessionId: string,
  text: string,
  adminName: string = 'Support Admin'
): Promise<boolean> {
  const cleanText = text.trim();
  if (!cleanText) return false;

  const now = new Date().toISOString();
  const newMessage: ChatMessage = {
    id: `msg_admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: 'admin',
    senderName: adminName,
    text: cleanText,
    timestamp: now
  };

  try {
    const ref = doc(db, 'support_chats', sessionId);
    await updateDoc(ref, {
      messages: arrayUnion(newMessage),
      lastMessage: cleanText,
      lastMessageAt: now,
      unreadByAdmin: false,
      unreadByUser: true
    });
    return true;
  } catch (err) {
    console.error('Error sending admin reply:', err);
    return false;
  }
}

// 5. Real-Time Listener for all chat sessions (used by Admin Panel)
export function subscribeToAllLiveChats(
  onUpdate: (chats: SupportChatSession[]) => void
): () => void {
  try {
    const q = query(collection(db, 'support_chats'), orderBy('lastMessageAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const chats: SupportChatSession[] = [];
        snap.forEach((d) => {
          chats.push(d.data() as SupportChatSession);
        });
        onUpdate(chats);
      },
      (err) => {
        console.warn('Admin live chats list listener error:', err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('Failed to subscribe to all live chats:', err);
    return () => {};
  }
}

// 6. Mark chat as read
export async function markChatReadByAdmin(sessionId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'support_chats', sessionId), {
      unreadByAdmin: false
    });
  } catch {
    // Ignore
  }
}

export async function markChatReadByUser(sessionId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'support_chats', sessionId), {
      unreadByUser: false
    });
  } catch {
    // Ignore
  }
}

// 7. Helper: Forward message to Admin's Telegram bot with 1-click reply URL
async function notifyAdminViaTelegram(
  sessionId: string,
  userName: string,
  userEmail: string | undefined,
  messageText: string
): Promise<void> {
  const config = await getTelegramConfig();
  if (!config.enabled || !config.botToken.trim() || !config.adminChatId.trim()) {
    return;
  }

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://purendar950.github.io';
  const replyUrl = `${siteOrigin}/?admin_chat=${encodeURIComponent(sessionId)}`;

  const caption =
    `💬 <b>NEW LIVE CHAT MESSAGE!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Candidate:</b> ${userName || 'Candidate'}\n` +
    (userEmail ? `📧 <b>Email:</b> <code>${userEmail}</code>\n` : '') +
    `🆔 <b>Session:</b> <code>#${sessionId.substring(sessionId.length - 8)}</code>\n` +
    `⏰ <b>Time:</b> ${new Date().toLocaleTimeString('en-IN')}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📝 <b>Message:</b>\n` +
    `<i>${messageText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ <i>Tap below to open chat & reply instantly:</i>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '💬 Open Live Chat Thread & Reply', url: replyUrl }
      ],
      [
        { text: '🛡️ Open Admin Portal', url: `${siteOrigin}/?admin_portal=1` }
      ]
    ]
  };

  try {
    await fetch(`https://api.telegram.org/bot${config.botToken.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.adminChatId.trim(),
        text: caption,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      })
    });
  } catch (err) {
    console.warn('Failed to send live chat Telegram alert:', err);
  }
}
