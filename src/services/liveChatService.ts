/**
 * Real-Time Live Support Chat Service
 * Enables candidates to chat directly with Administrators through an on-website widget.
 *
 * Architecture:
 * 1. Dual Persistence: Messages are immediately saved locally in localStorage (offline-first,
 *    zero UI delay) and synced in real-time to Cloud Firestore (support_chats collection).
 * 2. Telegram Alert Dispatch: Sends instant notifications with 1-click reply buttons
 *    to the Admin's Telegram bot independently from Firestore status.
 * 3. Real-Time Sync: Changes are streamed to candidate & admin via onSnapshot listeners.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, UserProfile } from './firebase';
import { getTelegramConfig, TelegramConfig, getAppBaseUrl } from './telegramService';

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

const STORAGE_KEY_SESSION_ID = 'up_support_chat_session_id';
const STORAGE_KEY_SESSION_DATA = 'up_support_chat_data_v2';

// Helper: Read local cached session
export function getLocalChatSession(): SupportChatSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION_DATA);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  return null;
}

// Helper: Save local cached session
export function saveLocalChatSession(session: SupportChatSession): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSION_DATA, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEY_SESSION_ID, session.id);
  } catch {
    // Ignore
  }
}

// 1. Get or Create Session for current browser / user
export async function getOrCreateChatSession(currentUser?: UserProfile | null): Promise<SupportChatSession> {
  // Check local cache first
  const cached = getLocalChatSession();
  let sessionId = cached?.id || localStorage.getItem(STORAGE_KEY_SESSION_ID);

  if (cached && sessionId) {
    if (currentUser && (!cached.userId || cached.userName === 'Candidate')) {
      cached.userId = currentUser.uid;
      cached.userName = currentUser.displayName || cached.userName;
      cached.userEmail = currentUser.email || cached.userEmail;
      saveLocalChatSession(cached);
      // Sync user profile to Firestore in background
      try {
        await setDoc(doc(db, 'support_chats', sessionId), cached, { merge: true });
      } catch {}
    }

    // Attempt background cloud sync
    getDoc(doc(db, 'support_chats', sessionId))
      .then((snap) => {
        if (snap.exists()) {
          const cloud = snap.data() as SupportChatSession;
          // Merge messages so neither local nor cloud messages are lost
          const msgMap = new Map<string, ChatMessage>();
          (cached.messages || []).forEach((m) => msgMap.set(m.id, m));
          (cloud.messages || []).forEach((m) => msgMap.set(m.id, m));
          const mergedList = Array.from(msgMap.values()).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          const mergedSession: SupportChatSession = {
            ...cloud,
            ...cached,
            messages: mergedList,
            lastMessage: mergedList[mergedList.length - 1]?.text || cached.lastMessage,
            lastMessageAt: mergedList[mergedList.length - 1]?.timestamp || cached.lastMessageAt
          };
          saveLocalChatSession(mergedSession);
        } else {
          // Push local session up to Firestore
          setDoc(doc(db, 'support_chats', sessionId!), cached, { merge: true }).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Live chat background sync warning:', err);
      });

    return cached;
  }

  // Create brand new session
  sessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
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

  saveLocalChatSession(initialSession);

  // Sync to Firestore with merge: true (never throws document-not-found)
  try {
    await setDoc(doc(db, 'support_chats', sessionId), initialSession, { merge: true });
  } catch (err) {
    console.warn('Initial chat session Firestore sync warning:', err);
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
          const cloudSession = snap.data() as SupportChatSession;
          // Merge with local cache to avoid overwriting optimistic messages
          const cached = getLocalChatSession();
          if (cached && cached.id === sessionId) {
            const msgMap = new Map<string, ChatMessage>();
            (cached.messages || []).forEach((m) => msgMap.set(m.id, m));
            (cloudSession.messages || []).forEach((m) => msgMap.set(m.id, m));
            const mergedList = Array.from(msgMap.values()).sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            const fullSession: SupportChatSession = {
              ...cloudSession,
              messages: mergedList
            };
            saveLocalChatSession(fullSession);
            onUpdate(fullSession);
          } else {
            saveLocalChatSession(cloudSession);
            onUpdate(cloudSession);
          }
        }
      },
      (err) => {
        console.warn('Live chat onSnapshot notice:', err);
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
  userEmail?: string,
  configOverride?: TelegramConfig | null
): Promise<{ success: boolean; message: ChatMessage }> {
  const cleanText = text.trim();
  const now = new Date().toISOString();
  const newMessage: ChatMessage = {
    id: `msg_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: 'user',
    senderName: userName || 'Candidate',
    text: cleanText,
    timestamp: now
  };

  // 1. Immediately update Local Storage (instant optimistic persistence)
  let currentSession = getLocalChatSession();
  if (!currentSession || currentSession.id !== sessionId) {
    currentSession = {
      id: sessionId,
      userName: userName || 'Candidate',
      userEmail: userEmail || '',
      status: 'open',
      lastMessage: cleanText,
      lastMessageAt: now,
      unreadByAdmin: true,
      unreadByUser: false,
      messages: [newMessage],
      createdAt: now
    };
  } else {
    currentSession.messages = [...(currentSession.messages || []), newMessage];
    currentSession.lastMessage = cleanText;
    currentSession.lastMessageAt = now;
    currentSession.unreadByAdmin = true;
    currentSession.userName = userName || currentSession.userName;
    currentSession.userEmail = userEmail || currentSession.userEmail;
  }
  saveLocalChatSession(currentSession);

  // 2. Dispatch Telegram Alert in parallel (doesn't wait for Firestore)
  notifyAdminViaTelegram(sessionId, userName, userEmail, cleanText, configOverride).catch((err) => {
    console.warn('Telegram live alert dispatch failed:', err);
  });

  // 3. Sync to Firestore using setDoc with merge: true (never crashes if doc does not exist)
  try {
    const ref = doc(db, 'support_chats', sessionId);
    await setDoc(ref, currentSession, { merge: true });
  } catch (err) {
    console.warn('Firestore live chat sync notice (stored locally):', err);
  }

  return { success: true, message: newMessage };
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
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const existing = snap.data() as SupportChatSession;
      const updatedMessages = [...(existing.messages || []), newMessage];
      await setDoc(
        ref,
        {
          messages: updatedMessages,
          lastMessage: cleanText,
          lastMessageAt: now,
          unreadByAdmin: false,
          unreadByUser: true
        },
        { merge: true }
      );
    } else {
      await setDoc(
        ref,
        {
          id: sessionId,
          userName: 'Candidate',
          status: 'open',
          messages: [newMessage],
          lastMessage: cleanText,
          lastMessageAt: now,
          unreadByAdmin: false,
          unreadByUser: true,
          createdAt: now
        },
        { merge: true }
      );
    }
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
        console.warn('Admin live chats list listener notice:', err);
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
    await setDoc(doc(db, 'support_chats', sessionId), { unreadByAdmin: false }, { merge: true });
  } catch {
    // Ignore
  }
}

export async function markChatReadByUser(sessionId: string): Promise<void> {
  const cached = getLocalChatSession();
  if (cached && cached.id === sessionId) {
    cached.unreadByUser = false;
    saveLocalChatSession(cached);
  }
  try {
    await setDoc(doc(db, 'support_chats', sessionId), { unreadByUser: false }, { merge: true });
  } catch {
    // Ignore
  }
}

// 7. Dispatch Telegram Notification to Admin
export async function notifyAdminViaTelegram(
  sessionId: string,
  userName: string,
  userEmail: string | undefined,
  messageText: string,
  configOverride?: TelegramConfig | null
): Promise<{ success: boolean; message: string }> {
  const config = configOverride || (await getTelegramConfig());

  if (!config || !config.enabled || !config.botToken?.trim() || !config.adminChatId?.trim()) {
    console.warn('Telegram live chat alert skipped: botToken or adminChatId not yet loaded');
    return { success: false, message: 'Telegram config incomplete' };
  }

  const appBaseUrl = getAppBaseUrl();
  const secret = config.approvalSecretToken || '';
  const replyUrl = `${appBaseUrl}?admin_chat=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(secret)}`;

  const caption =
    `⚡ <b>EXAM TYPING • LIVE SUPPORT TICKET</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Candidate:</b> ${userName || 'Candidate'}\n` +
    (userEmail ? `📧 <b>Email:</b> <code>${userEmail}</code>\n` : '') +
    `🆔 <b>Ticket ID:</b> <code>#TK-${sessionId.substring(sessionId.length - 8).toUpperCase()}</code>\n` +
    `⏰ <b>Time:</b> ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💬 <b>Inquiry:</b>\n` +
    `<blockquote>${messageText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</blockquote>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🛡️ <i>Tap below to reply to the candidate directly inside Telegram:</i>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: '💬 Reply to Candidate (In-App)',
          web_app: { url: replyUrl }
        }
      ],
      [
        { text: '🛡️ Open Admin Suite', url: `${appBaseUrl}?admin_portal=1` }
      ]
    ]
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.adminChatId.trim(),
        text: caption,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      })
    });
    const data = await res.json();
    return { success: Boolean(data.ok), message: data.ok ? 'Alert sent' : data.description };
  } catch (err: any) {
    console.warn('Failed to send live chat Telegram alert:', err);
    return { success: false, message: err?.message || 'Network error' };
  }
}
