/**
 * Payment alert job (runs on GitHub Actions every 15 minutes).
 *
 * Students pay by UPI and submit the UTR + screenshot in the app. The browser
 * cannot send the Telegram alert itself because the bot token is admin-only in
 * Firestore (and must stay that way). This job signs in with a dedicated
 * notifier account, finds pending submissions that have not been alerted yet,
 * and forwards them to the admin's Telegram chat. It does the same for
 * live-chat messages the admin has not read yet.
 */

const PROJECT_ID = 'upp-typing';
const API_KEY = 'AIzaSyCuh2DBIkWE5_WNkVRQ0whPUOGCGiunPRU';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)`;

const EMAIL = process.env.NOTIFIER_EMAIL;
const PASSWORD = process.env.NOTIFIER_PASSWORD;

const esc = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error('NOTIFIER_EMAIL / NOTIFIER_PASSWORD secrets are not set.');
    process.exit(1);
  }

  // ── 1. Sign in with the notifier account ────────────────────────────
  const signInRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true })
    }
  );
  const signIn = await signInRes.json();
  if (!signIn.idToken) {
    console.error('Notifier sign-in failed:', JSON.stringify(signIn));
    process.exit(1);
  }
  const token = signIn.idToken;
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── 2. Read the Telegram bot settings ───────────────────────────────
  const cfgRes = await fetch(`${BASE}/documents/system_settings/telegram_config`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!cfgRes.ok) {
    console.error(
      'Could not read telegram_config: ' + cfgRes.status +
      (cfgRes.status === 403
        ? ' — the updated firestore.rules (with the payment notifier) have not been published in the Firebase console yet.'
        : '')
    );
    process.exit(1);
  }
  const cfgDoc = await cfgRes.json();
  const cfg = cfgDoc.fields || {};
  const botToken = (cfg.botToken?.stringValue || '').trim();
  const chatId = (cfg.adminChatId?.stringValue || '').trim();
  const approvalSecret = (cfg.approvalSecretToken?.stringValue || '').trim();
  if (cfg.enabled?.booleanValue === false || !botToken || !chatId) {
    console.log('Telegram alerts are disabled or not configured. Nothing sent.');
    process.exit(0);
  }

  // ── 3. Find pending submissions that were never alerted ─────────────
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'payment_submissions' }],
      where: {
        fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'pending' } }
      },
      limit: 25
    }
  };
  const qRes = await fetch(`${BASE}/documents:runQuery`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(query)
  });
  if (!qRes.ok) {
    console.error(
      'Reading pending payments failed: ' + qRes.status +
      (qRes.status === 403
        ? ' — the updated firestore.rules (with the payment notifier) have not been published in the Firebase console yet.'
        : '')
    );
    process.exit(1);
  }
  const rows = await qRes.json();
  const docs = rows
    .filter((r) => r.document)
    .map((r) => r.document)
    .filter((d) => !d.fields.alertedAt);
  console.log(`Found ${docs.length} unalerted pending submission(s).`);

  const appBaseUrl = 'https://purendar950.github.io/Exam_Typing_Test/';

  for (const d of docs) {
    const f = d.fields;
    const id = d.name.split('/').pop();
    const amount = f.finalAmount?.integerValue || f.finalAmount?.doubleValue || f.finalAmountPaid?.integerValue || 0;
    const exam = f.selectedExamTitle?.stringValue || f.examTitle?.stringValue || 'All exams pass';
    const promo = f.promoCodeApplied?.stringValue || f.promoCodeUsed?.stringValue || '';
    const submitted = f.submittedAt?.stringValue || '';
    const photo = f.screenshotUrl?.stringValue || '';

    const caption =
      `🚨 <b>NEW PAYMENT SUBMISSION</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Name:</b> ${stripHtml(f.userName?.stringValue)}\n` +
      `📧 <b>Email:</b> <code>${stripHtml(f.userEmail?.stringValue)}</code>\n` +
      (f.userPhone?.stringValue ? `📱 <b>Phone:</b> <code>${stripHtml(f.userPhone.stringValue)}</code>\n` : '') +
      `📦 <b>Plan:</b> ${stripHtml(f.planName?.stringValue)}\n` +
      `🎯 <b>Exam:</b> ${stripHtml(exam)}\n` +
      `💰 <b>Amount:</b> ₹${amount}${promo ? ` (coupon ${stripHtml(promo)})` : ''}\n` +
      `🧾 <b>UTR / Txn ID:</b> <code>${stripHtml(f.utrNumber?.stringValue)}</code>\n` +
      `⏰ <b>Submitted:</b> ${esc(submitted)}\n` +
      `🆔 <b>Request ID:</b> <code>#${esc(id.slice(0, 12))}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ Open the site admin panel to approve or reject this payment.`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: '✅ Approve in admin panel', url: `${appBaseUrl}?admin_approve=${encodeURIComponent(id)}&token=${encodeURIComponent(approvalSecret)}` },
          { text: '❌ Reject', url: `${appBaseUrl}?admin_reject=${encodeURIComponent(id)}&token=${encodeURIComponent(approvalSecret)}` }
        ],
        [{ text: '🛡️ Open admin panel', url: `${appBaseUrl}?admin_portal=1` }]
      ]
    };

    let sent = false;
    let detail = '';

    if (photo.startsWith('data:image')) {
      try {
        const b64 = photo.slice(photo.indexOf(',') + 1);
        const fd = new FormData();
        fd.append('chat_id', chatId);
        fd.append('caption', caption);
        fd.append('parse_mode', 'HTML');
        fd.append('reply_markup', JSON.stringify(replyMarkup));
        fd.append('photo', new Blob([Buffer.from(b64, 'base64')]), `receipt_${id.slice(0, 12)}.jpg`);
        const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: fd
        });
        const photoData = await photoRes.json();
        sent = !!photoData.ok;
        if (!sent) detail = photoData.description || 'sendPhoto failed';
      } catch (err) {
        detail = err.message;
      }
    }

    if (!sent) {
      const textRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'HTML', reply_markup: replyMarkup })
      });
      const textData = await textRes.json();
      sent = !!textData.ok;
      if (!sent) detail = textData.description || 'sendMessage failed';
    }

    if (sent) {
      const now = new Date().toISOString();
      const patchRes = await fetch(
        `${BASE}/documents/payment_submissions/${id}?updateMask.fieldPaths=alertedAt`,
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ fields: { alertedAt: { stringValue: now } } })
        }
      );
      console.log(`Alerted ${id} (patch ${patchRes.ok ? 'ok' : patchRes.status}).`);
    } else {
      console.error(`Could not alert ${id}: ${detail}`);
    }
  }

  // ── 4. Live-chat messages waiting for the admin ─────────────────────
  const chatRes = await fetch(`${BASE}/documents:runQuery`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'support_chats' }],
        where: {
          fieldFilter: { field: { fieldPath: 'unreadByAdmin' }, op: 'EQUAL', value: { booleanValue: true } }
        },
        limit: 25
      }
    })
  });
  if (!chatRes.ok) {
    console.error('Reading unread support chats failed: ' + chatRes.status);
    process.exit(1);
  }
  const chats = (await chatRes.json())
    .filter((r) => r.document)
    .map((r) => r.document)
    .filter((d) => (d.fields.alertedMessageAt?.stringValue || '') !== (d.fields.lastMessageAt?.stringValue || ''));
  console.log(`Found ${chats.length} unalerted support chat(s).`);

  for (const d of chats) {
    const f = d.fields;
    const id = d.name.split('/').pop();
    const lastAt = f.lastMessageAt?.stringValue || '';
    const text =
      `💬 <b>NEW SUPPORT MESSAGE</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Candidate:</b> ${esc(f.userName?.stringValue || 'Candidate')}\n` +
      (f.userEmail?.stringValue ? `📧 <b>Email:</b> <code>${esc(f.userEmail.stringValue)}</code>\n` : '') +
      `🆔 <b>Ticket:</b> <code>#TK-${esc(id.slice(-8).toUpperCase())}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<blockquote>${esc((f.lastMessage?.stringValue || '').slice(0, 1500))}</blockquote>`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '💬 Reply in admin panel', url: `${appBaseUrl}?admin_portal=1` }]]
        }
      })
    });
    const data = await res.json();
    if (data.ok) {
      const patchRes = await fetch(
        `${BASE}/documents/support_chats/${id}?updateMask.fieldPaths=alertedMessageAt`,
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ fields: { alertedMessageAt: { stringValue: lastAt } } })
        }
      );
      console.log(`Alerted chat ${id} (patch ${patchRes.ok ? 'ok' : patchRes.status}).`);
    } else {
      console.error(`Could not alert chat ${id}: ${data.description || 'sendMessage failed'}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
