/**
 * Telegram Notification & Instant Admin Approval Engine
 * Allows candidates' payment submissions (with screenshots & UTR) to be forwarded
 * instantly to the administrator's Telegram bot/chat, with 1-click inline approval links.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PaymentSubmission, approvePaymentSubmission, rejectPaymentSubmission } from './paymentService';

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  adminChatId: string;
  approvalSecretToken: string;
  communityChannelUrl: string;
  discussionGroupUrl: string;
  supportUsername: string;
}

const STORAGE_KEY_TELEGRAM_CONFIG = 'up_typing_telegram_config';

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  enabled: true,
  botToken: '9045092848:AAG2KDa7be_krygGwKjiOu3WXSxo5lij06Y',
  adminChatId: '',
  approvalSecretToken: 'adm_' + Math.random().toString(36).substring(2, 12),
  communityChannelUrl: 'https://t.me/SSC_PYQ_COMPILATIONS',
  discussionGroupUrl: 'https://t.me/SSC_PYQ_COMPILATIONS',
  supportUsername: 'ExamTypingSupportBot'
};

// 1. Get & Save Telegram Configuration
export async function getTelegramConfig(): Promise<TelegramConfig> {
  let localConfig: TelegramConfig | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TELEGRAM_CONFIG);
    if (raw) {
      localConfig = JSON.parse(raw);
    }
  } catch {
    // Ignore
  }

  // Attempt to load from cloud Firestore
  try {
    const snap = await getDoc(doc(db, 'system_settings', 'telegram_config'));
    if (snap.exists()) {
      const cloud = snap.data() as Partial<TelegramConfig>;
      const merged: TelegramConfig = {
        enabled: cloud.enabled ?? localConfig?.enabled ?? DEFAULT_TELEGRAM_CONFIG.enabled,
        botToken: cloud.botToken || localConfig?.botToken || DEFAULT_TELEGRAM_CONFIG.botToken,
        adminChatId: cloud.adminChatId || localConfig?.adminChatId || DEFAULT_TELEGRAM_CONFIG.adminChatId,
        approvalSecretToken: cloud.approvalSecretToken || localConfig?.approvalSecretToken || DEFAULT_TELEGRAM_CONFIG.approvalSecretToken,
        communityChannelUrl: cloud.communityChannelUrl || localConfig?.communityChannelUrl || DEFAULT_TELEGRAM_CONFIG.communityChannelUrl,
        discussionGroupUrl: cloud.discussionGroupUrl || localConfig?.discussionGroupUrl || DEFAULT_TELEGRAM_CONFIG.discussionGroupUrl,
        supportUsername: cloud.supportUsername || localConfig?.supportUsername || DEFAULT_TELEGRAM_CONFIG.supportUsername
      };
      localStorage.setItem(STORAGE_KEY_TELEGRAM_CONFIG, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch telegram config from Firestore:', err);
  }

  return localConfig || DEFAULT_TELEGRAM_CONFIG;
}

export async function saveTelegramConfig(config: TelegramConfig): Promise<void> {
  localStorage.setItem(STORAGE_KEY_TELEGRAM_CONFIG, JSON.stringify(config));
  try {
    await setDoc(doc(db, 'system_settings', 'telegram_config'), config, { merge: true });
  } catch (err) {
    console.warn('Could not save telegram config to Firestore:', err);
  }
}

// Convert Base64 data URL to Blob for multipart upload
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const byteString = atob(parts[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

// 2. Test Connection Ping
export async function testTelegramPing(config: TelegramConfig): Promise<{ success: boolean; message: string }> {
  if (!config.botToken.trim()) {
    return { success: false, message: 'Please enter a Telegram Bot Token from @BotFather' };
  }
  if (!config.adminChatId.trim()) {
    return { success: false, message: 'Please enter your Admin Chat ID (from @userinfobot)' };
  }

  const siteOrigin = window.location.origin;
  const testCaption = `🤖 <b>Telegram Admin Alert Engine Connected!</b>\n\n` +
    `✅ Your Telegram bot is active and wired to <b>Exam Typing Mentor</b>.\n\n` +
    `When candidates make payments, their <b>payment receipt screenshot</b>, <b>UTR number</b>, and <b>1-click approval buttons</b> will be delivered straight to this chat.`;

  try {
    const url = `https://api.telegram.org/bot${config.botToken.trim()}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.adminChatId.trim(),
        text: testCaption,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🛡️ Open Admin Portal', url: `${siteOrigin}/?admin_portal=1` }
            ]
          ]
        }
      })
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true, message: '✅ Test message sent! Check your Telegram app.' };
    } else {
      return { success: false, message: `Telegram API error: ${data.description || 'Unknown error'}` };
    }
  } catch (err: any) {
    return { success: false, message: `Network error: ${err?.message || 'Could not reach Telegram'}` };
  }
}

// 3. Send Payment Submission Alert with Screenshot & 1-Click Approval Buttons
export async function sendTelegramPaymentNotification(
  sub: PaymentSubmission,
  configOverride?: TelegramConfig
): Promise<{ success: boolean; message: string }> {
  const config = configOverride || (await getTelegramConfig());

  if (!config.enabled || !config.botToken.trim() || !config.adminChatId.trim()) {
    return { success: false, message: 'Telegram integration is not configured or disabled' };
  }

  const siteOrigin = window.location.origin;
  const approveUrl = `${siteOrigin}/?admin_approve=${encodeURIComponent(sub.id)}&token=${encodeURIComponent(config.approvalSecretToken)}`;
  const rejectUrl = `${siteOrigin}/?admin_reject=${encodeURIComponent(sub.id)}&token=${encodeURIComponent(config.approvalSecretToken)}`;
  const adminSuiteUrl = `${siteOrigin}/?admin_portal=1`;

  const amount = sub.finalAmount || sub.finalAmountPaid || 0;
  const examName = sub.selectedExamTitle || sub.examTitle || 'All 129 Exams Mega Pass';
  const promoInfo = (sub.promoCodeApplied || sub.promoCodeUsed)
    ? `\n🎟️ <b>Coupon Used:</b> <code>${sub.promoCodeApplied || sub.promoCodeUsed}</code> (-₹${sub.discountAmount})`
    : '';

  const caption =
    `🚨 <b>NEW PAYMENT SUBMISSION!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Candidate:</b> ${sub.userName || 'Candidate'}\n` +
    `📧 <b>Email:</b> <code>${sub.userEmail}</code>\n` +
    (sub.userPhone ? `📱 <b>Phone:</b> <code>${sub.userPhone}</code>\n` : '') +
    `📦 <b>Plan:</b> ${sub.planName} (${sub.durationMonths || 1} Month${(sub.durationMonths || 1) > 1 ? 's' : ''})\n` +
    `🎯 <b>Target Exam:</b> ${examName}\n` +
    `💰 <b>Amount Paid:</b> <b>₹${amount}</b>${promoInfo}\n` +
    `🧾 <b>UTR / Txn ID:</b> <code>${sub.utrNumber}</code>\n` +
    `⏰ <b>Date & Time:</b> ${new Date(sub.submittedAt).toLocaleString('en-IN')}\n` +
    `🆔 <b>Request ID:</b> <code>#${sub.id.substring(0, 8)}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ <i>Tap below to approve Pro access instantly:</i>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '✅ Approve Pro Access', url: approveUrl },
        { text: '❌ Reject Payment', url: rejectUrl }
      ],
      [
        { text: '🛡️ Open Admin Portal', url: adminSuiteUrl }
      ]
    ]
  };

  try {
    // If a screenshot is attached
    if (sub.screenshotUrl && sub.screenshotUrl.startsWith('data:image')) {
      const blob = dataUrlToBlob(sub.screenshotUrl);
      const formData = new FormData();
      formData.append('chat_id', config.adminChatId.trim());
      formData.append('photo', blob, `receipt_${sub.id.substring(0, 8)}.jpg`);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      formData.append('reply_markup', JSON.stringify(inlineKeyboard));

      const res = await fetch(`https://api.telegram.org/bot${config.botToken.trim()}/sendPhoto`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.ok) {
        return { success: true, message: 'Telegram photo alert delivered to admin' };
      }
    }

    // Fallback to text message if photo fails or screenshotUrl is not data URL
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
    return {
      success: !!data.ok,
      message: data.ok ? 'Telegram alert delivered' : (data.description || 'Telegram alert failed')
    };
  } catch (err: any) {
    console.warn('Failed to send Telegram notification:', err);
    return { success: false, message: err?.message || 'Network error' };
  }
}

// 4. Handle 1-Click Tokenized URL Approval from Telegram
export async function handleTelegramApprovalFromUrl(): Promise<{
  handled: boolean;
  success: boolean;
  action: 'approve' | 'reject' | 'portal' | 'none';
  message: string;
  submissionId?: string;
}> {
  if (typeof window === 'undefined') {
    return { handled: false, success: false, action: 'none', message: '' };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const approveId = urlParams.get('admin_approve');
  const rejectId = urlParams.get('admin_reject');
  const token = urlParams.get('token');
  const isPortal = urlParams.get('admin_portal') === '1';

  if (!approveId && !rejectId && !isPortal) {
    return { handled: false, success: false, action: 'none', message: '' };
  }

  const config = await getTelegramConfig();

  // If opening portal directly
  if (isPortal) {
    cleanQueryParam(['admin_portal']);
    return {
      handled: true,
      success: true,
      action: 'portal',
      message: 'Opening Admin Portal'
    };
  }

  // Token validation for secure 1-click approvals
  if (!token || token.trim() !== config.approvalSecretToken.trim()) {
    cleanQueryParam(['admin_approve', 'admin_reject', 'token']);
    return {
      handled: true,
      success: false,
      action: 'none',
      message: '⚠️ Invalid or expired Telegram authorization token.'
    };
  }

  if (approveId) {
    try {
      const res = await approvePaymentSubmission(approveId, 'telegram_admin');
      cleanQueryParam(['admin_approve', 'token']);
      if (res.success) {
        return {
          handled: true,
          success: true,
          action: 'approve',
          submissionId: approveId,
          message: `✅ Payment #${approveId.substring(0, 8)} approved via Telegram! Candidate Pro access is now active.`
        };
      } else {
        return {
          handled: true,
          success: false,
          action: 'approve',
          message: `Approval failed: ${res.message || 'Submission not found'}`
        };
      }
    } catch (err: any) {
      cleanQueryParam(['admin_approve', 'token']);
      return {
        handled: true,
        success: false,
        action: 'approve',
        message: err?.message || 'Error executing approval'
      };
    }
  }

  if (rejectId) {
    try {
      const res = await rejectPaymentSubmission(rejectId, 'Rejected via Telegram Admin button', 'telegram_admin');
      cleanQueryParam(['admin_reject', 'token']);
      if (res.success) {
        return {
          handled: true,
          success: true,
          action: 'reject',
          submissionId: rejectId,
          message: `Payment #${rejectId.substring(0, 8)} marked as rejected via Telegram.`
        };
      } else {
        return {
          handled: true,
          success: false,
          action: 'reject',
          message: `Rejection failed: ${res.message || 'Submission not found'}`
        };
      }
    } catch (err: any) {
      cleanQueryParam(['admin_reject', 'token']);
      return {
        handled: true,
        success: false,
        action: 'reject',
        message: err?.message || 'Error executing rejection'
      };
    }
  }

  return { handled: false, success: false, action: 'none', message: '' };
}

function cleanQueryParam(params: string[]) {
  try {
    const url = new URL(window.location.href);
    params.forEach((p) => url.searchParams.delete(p));
    window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
  } catch {
    // Ignore
  }
}
