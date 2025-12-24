const { Bot, InlineKeyboard, Api } = require('grammy');
const axios = require('axios');

/** =========================
 * SambaNova Cloud (OpenAI-compatible) Integration
 * Env vars:
 *  - SAMBANOVA_API_KEY (required)
 *  - SAMBANOVA_BASE_URL (optional, default https://api.sambanova.ai/v1)
 *  - SAMBANOVA_DEFAULT_MODEL (optional)
 * Commands:
 *  - /snmodels
 *  - /snask <prompt>
 *  - /snaskmodel <model> | <prompt>
 * ========================= */
const SAMBANOVA_API_KEY = process.env.SAMBANOVA_API_KEY || '';
const SAMBANOVA_BASE_URL = process.env.SAMBANOVA_BASE_URL || 'https://api.sambanova.ai/v1';
const SAMBANOVA_DEFAULT_MODEL = process.env.SAMBANOVA_DEFAULT_MODEL || 'Meta-Llama-3.1-70B-Instruct';

async function sambaListModels() {
  const url = `${SAMBANOVA_BASE_URL.replace(/\/$/, '')}/models`;
  const res = await axios.get(url, {
    timeout: 20000,
    headers: SAMBANOVA_API_KEY ? { Authorization: `Bearer ${SAMBANOVA_API_KEY}` } : {},
  });
  return res.data;
}

async function sambaChatCompletion({ model, messages, temperature = 0.4, max_tokens = 600 }) {
  const url = `${SAMBANOVA_BASE_URL.replace(/\/$/, '')}/chat/completions`;
  const res = await axios.post(
    url,
    { model, messages, temperature, max_tokens },
    {
      timeout: 45000,
      headers: {
        'Content-Type': 'application/json',
        ...(SAMBANOVA_API_KEY ? { Authorization: `Bearer ${SAMBANOVA_API_KEY}` } : {}),
      },
    }
  );
  return res.data;
}

function ensureSambaKeyConfigured(ctx) {
  if (!SAMBANOVA_API_KEY) {
    sendFormattedMessage(
      ctx,
      '⚠️ SambaNova API key not configured.\n\nSet env var: `SAMBANOVA_API_KEY` on Railway, then restart the bot.'
    );
    return false;
  }
  return true;
}

const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

// Initialize bot with proper error handling
const botToken = process.env.BOT_TOKEN;

if (!botToken) {
  console.error('❌ BOT_TOKEN environment variable is not set!');
  console.error('Please set BOT_TOKEN in Railway environment variables');
  process.exit(1);
}

// Initialize bot
const bot = new Bot(botToken);


// ===============================
// GLOBAL COMMAND + RESPONSE LOGGER
// Sends every command and bot response to a log channel (e.g. @OsintLogsUpdates)
// Requirements:
// 1) Add your bot as ADMIN in the channel
// 2) Set LOG_CHANNEL in env (recommended) OR use default below
// ===============================
const { AsyncLocalStorage } = require('async_hooks');
const als = new AsyncLocalStorage();

const LOG_CHANNEL = process.env.LOG_CHANNEL || '@OsintLogsUpdates'; // can be @channelusername or numeric channel id
const logApi = new Api(botToken); // separate API (no transformers) to avoid recursion

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendLogText(html) {
  if (!LOG_CHANNEL) return;
  const MAX = 3900; // keep margin for HTML tags
  const chunks = [];
  let buf = html;
  while (buf.length > MAX) {
    chunks.push(buf.slice(0, MAX));
    buf = buf.slice(MAX);
  }
  chunks.push(buf);

  for (const chunk of chunks) {
    try {
      await logApi.sendMessage(LOG_CHANNEL, chunk, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    } catch (e) {
      // Don't crash the bot if logging fails (e.g. bot not admin / wrong channel)
      console.error('⚠️ Log channel send failed:', e?.description || e?.message || e);
      break;
    }
  }
}

function formatUser(store) {
  if (!store) return 'Unknown';
  const u = store.from || {};
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown';
  const uname = u.username ? `@${u.username}` : '';
  const id = u.id ? String(u.id) : '';
  return `${escapeHtml(name)} ${escapeHtml(uname)} <code>${escapeHtml(id)}</code>`.trim();
}

function formatChat(store) {
  if (!store) return 'Unknown';
  const c = store.chat || {};
  const title = c.title || c.username || c.id || 'Unknown';
  const type = c.type || '';
  const id = c.id ? String(c.id) : '';
  return `${escapeHtml(String(title))} ${type ? `(${escapeHtml(type)})` : ''} <code>${escapeHtml(id)}</code>`.trim();
}

// Log EVERY incoming command/callback
bot.use(async (ctx, next) => {
  const store = {
    updateId: ctx.update?.update_id,
    from: ctx.from,
    chat: ctx.chat,
    at: new Date().toISOString(),
    updateType: ctx.update?.callback_query ? 'callback_query' : (ctx.message ? 'message' : 'update'),
    text: ctx.message?.text,
    data: ctx.update?.callback_query?.data,
  };

  return als.run(store, async () => {
    try {
      const isCommand = typeof store.text === 'string' && store.text.trim().startsWith('/');
      const isCallback = typeof store.data === 'string' && store.data.length > 0;

      if (isCommand || isCallback) {
        const payload = isCommand ? store.text.trim() : store.data;
        const kind = isCommand ? '📥 <b>COMMAND</b>' : '📥 <b>CALLBACK</b>';
        const html =
          `${kind}\n` +
          `👤 <b>User:</b> ${formatUser(store)}\n` +
          `💬 <b>Chat:</b> ${formatChat(store)}\n` +
          `🕒 <b>Time:</b> <code>${escapeHtml(store.at)}</code>\n` +
          `🧾 <b>Input:</b>\n<pre>${escapeHtml(payload)}</pre>`;
        await sendLogText(html);
      }
    } catch (e) {
      console.error('⚠️ Incoming log error:', e?.message || e);
    }

    return next();
  });
});

// Log EVERY outgoing response (sendMessage/editMessageText/sendPhoto/etc.)
bot.api.config.use(async (prev, method, payload, signal) => {
  const store = als.getStore();

  // Avoid logging our own logs (and avoid recursion)
  const targetChat = payload?.chat_id ?? payload?.to_chat_id;
  const targetIsLogChannel =
    targetChat === LOG_CHANNEL ||
    String(targetChat || '') === String(LOG_CHANNEL || '') ||
    (typeof LOG_CHANNEL === 'string' && typeof targetChat === 'string' && targetChat.toLowerCase() === LOG_CHANNEL.toLowerCase());

  // Call the real Telegram API first
  const result = await prev(method, payload, signal);

  try {
    if (targetIsLogChannel) return result;

    const shouldLog =
      method === 'sendMessage' ||
      method === 'editMessageText' ||
      method === 'sendPhoto' ||
      method === 'sendDocument' ||
      method === 'sendVideo' ||
      method === 'sendAudio' ||
      method === 'sendAnimation' ||
      method === 'sendSticker' ||
      method === 'sendVoice' ||
      method === 'sendPoll';

    if (!shouldLog) return result;

    let preview = '';
    if (method === 'sendMessage' || method === 'editMessageText') {
      preview = payload?.text || '';
    } else if (method === 'sendPhoto' || method === 'sendVideo' || method === 'sendAnimation' || method === 'sendDocument' || method === 'sendAudio' || method === 'sendVoice') {
      preview = payload?.caption || '';
    } else if (method === 'sendSticker') {
      preview = '[sticker]';
    } else if (method === 'sendPoll') {
      preview = payload?.question || '[poll]';
    }

    const chatId = payload?.chat_id ?? payload?.to_chat_id ?? '';
    const html =
      `📤 <b>BOT RESPONSE</b>\n` +
      `👤 <b>User:</b> ${formatUser(store)}\n` +
      `💬 <b>Chat:</b> ${formatChat(store)}\n` +
      `🎯 <b>To:</b> <code>${escapeHtml(String(chatId))}</code>\n` +
      `🧩 <b>Method:</b> <code>${escapeHtml(method)}</code>\n` +
      `📝 <b>Content:</b>\n<pre>${escapeHtml(String(preview || ''))}</pre>`;
    await sendLogText(html);
  } catch (e) {
    console.error('⚠️ Outgoing log error:', e?.message || e);
  }

  return result;
});


// ===============================
// CONFIGURATION (EDIT ONLY THIS)
// ===============================
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = -1003133803574; // Osint Updates (CONFIRMED)
const CHANNEL_URL = 'https://t.me/OsintShitUpdates';

// Admin Telegram IDs
const ADMINS = [process.env.ADMIN_USER_ID];

// ===============================
// MEMORY STORAGE (NO DB)
// ===============================
const users = new Map();
const registrationRequests = new Map();
const verifiedUsers = new Set(); // Track users who have verified channel membership
const registeredUsers = new Set(); // Track users who have completed registration

// Redeem code storage (in-memory; resets on restart)
// code -> { credits, maxUses, uses, redeemedBy:Set<string>, createdBy, createdAt, expiresAt }
const redeemCodes = new Map();
// Storage for revoke/expired/used-up codes (for stats & safety)
const revokedCodes = new Set(); // normalized codes revoked by admin
const expiredCodes = new Set(); // normalized codes expired and cleaned up
const usedUpCodes = new Set();
const redeemStats = { generated: 0, redeemed: 0 };  // normalized codes that hit maxUses
const adminId = process.env.ADMIN_USER_ID;

// Maintenance mode flag (stored in memory, will reset on bot restart)
let maintenanceMode = false;
let maintenanceMessage = "Bot is currently under maintenance. Please try again later.";

// Validate admin ID
if (!adminId) {
  console.error('❌ ADMIN_USER_ID environment variable is not set!');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log(`🤖 Bot Token: ${botToken.substring(0, 10)}...`);
console.log(`👑 Admin ID: ${adminId}`);

// Initialize admin user
users.set(adminId, {
  telegramId: adminId,
  username: 'fuck_sake',
  firstName: 'Admin',
  isAdmin: true,
  isApproved: true,
  credits: 999999,
  isPremium: true,
  totalQueries: 0,
  registrationDate: new Date()
});

// ===============================
// BULLETPROOF JOIN CHECK
// ===============================
async function checkChannelMembership(userId) {
  try {
    const member = await bot.api.getChatMember(CHANNEL_ID, userId);
    
    // Log the result for debugging
    console.log('[JOIN CHECK]', userId, member.status);
    
    // Check for all possible member statuses including 'restricted'
    return [
      'member',
      'administrator',
      'creator',
      'restricted'
    ].includes(member.status);
  } catch (error) {
    console.error('[JOIN CHECK ERROR]', error);
    return false;
  }
}

// Helper function to check if user is joined (alias for consistency)
async function isUserJoined(userId) {
  return await checkChannelMembership(userId);
}

// ===============================
// UNIVERSAL URL EXTRACTOR (fix [object Object])
// ===============================
function isHttpUrl(s) {
  return typeof s === "string" && /^https?:\/\//i.test(s);
}

// Finds the first http(s) URL anywhere inside a nested object/array/string
function findFirstUrlDeep(obj) {
  if (!obj) return null;

  // direct string
  if (typeof obj === "string") {
    return isHttpUrl(obj) ? obj : null;
  }

  // array: scan
  if (Array.isArray(obj)) {
    for (const v of obj) {
      const hit = findFirstUrlDeep(v);
      if (hit) return hit;
    }
    return null;
  }

  // object: prefer common keys first, then deep scan
  if (typeof obj === "object") {
    const preferredKeys = [
      // most common
      "video", "url", "download", "download_url", "link",
      // quality keys
      "hd", "sd", "hd_url", "sd_url", "hdLink", "sdLink",
      // nested common keys
      "result", "data", "media", "medias", "links", "response"
    ];

    for (const k of preferredKeys) {
      const hit = findFirstUrlDeep(obj[k]);
      if (hit) return hit;
    }

    for (const k of Object.keys(obj)) {
      const hit = findFirstUrlDeep(obj[k]);
      if (hit) return hit;
    }
  }

  return null;
}

// API Functions
async function getIpInfo(ip) {
  try {
    const url = ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json';
    const response = await axios.get(url);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch IP information' };
  }
}

async function getPhoneNumberInfo(number) {
  try {
    const response = await axios.get(`https://hitackgrop.vercel.app/get_data?mobile=${number}&key=Demo`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch phone number information' };
  }
}

async function getBasicNumberInfo(number) {
  try {
    const response = await axios.get(`https://ab-calltraceapi.vercel.app/info?number=${number}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch basic number information' };
  }
}

async function getInstagramInfo(username) {
  try {
    const response = await axios.get(`https://newinstainfoapi.anshppt19.workers.dev/info?username=${username}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch Instagram information' };
  }
}

async function getBinInfo(bin) {
  try {
    const response = await axios.get(`https://binsapi.vercel.app/api/bin?bin=${bin}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch BIN information' };
  }
}

async function getVehicleInfo(vehicleNumber) {
  try {
    const response = await axios.get(`https://vehicle-api-isuzu3-8895-nexusxnikhils-projects.vercel.app/api/vehicle?apikey=demo123&vehical=${vehicleNumber}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch vehicle information' };
  }
}

async function getFreeFireStats(uid) {
  try {
    const response = await axios.get(`https://anku-ffapi-inky.vercel.app/ff?uid=${uid}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch Free Fire statistics' };
  }
}

// ===============================
// INDIA POSTAL (PINCODE / POST OFFICE)
// ===============================
async function getIndiaPincodeInfo(pincode) {
  try {
    const res = await axios.get(`https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`, { timeout: 20000 });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch India pincode information' };
  }
}

async function getIndiaPostOfficeInfo(query) {
  try {
    const res = await axios.get(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`, { timeout: 20000 });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch India post office information' };
  }
}

// ===============================
// PAK REHU LOOKUP (SEPARATE /pak)
// ===============================
async function getRehuPakInfo(query) {
  try {
    const res = await axios.get(`https://rehu-pak-info.vercel.app/api/lookup?query=${encodeURIComponent(query)}&pretty=1`, { timeout: 30000 });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch /pak lookup information' };
  }
}

// ===============================
// IFSC LOOKUP (TEXT OUTPUT)
// ===============================
async function getIfscInfo(ifsc) {
  try {
    const res = await axios.get(`https://ab-ifscinfoapi.vercel.app/info?ifsc=${encodeURIComponent(ifsc)}`, { timeout: 20000 });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch IFSC information' };
  }
}

// ===============================
// YOUTUBE THUMBNAIL (SEND AS IMAGE)
// ===============================
async function sendYouTubeThumb(ctx, ytUrl) {
  const thumbApi = `https://old-studio-thum-down.oldhacker7866.workers.dev/?url=${encodeURIComponent(ytUrl)}`;

  const apiMeta = {
    ok: false,
    api: thumbApi,
    input: ytUrl,
    status: null,
    contentType: null,
    extractedImageUrl: null,
    note: null,
  };

  // Robust: fetch ourselves, then upload buffer to Telegram.
  const res = await axios.get(thumbApi, {
    timeout: 45000,
    responseType: 'arraybuffer',
    validateStatus: () => true,
    headers: {
      'accept': 'image/*,application/json;q=0.9,*/*;q=0.8',
      'user-agent': 'Mozilla/5.0'
    }
  });

  apiMeta.status = res.status;
  apiMeta.contentType = String(res.headers?.['content-type'] || '').toLowerCase();

  const ct = apiMeta.contentType;

  // Helper: send pretty JSON response (Telegram doesn't truly color JSON; codeblock is the closest)
  async function sendJsonResponse(extra = {}) {
    const payload = { ...apiMeta, ...extra };
    const pretty = JSON.stringify(payload, null, 2);
    await sendFormattedMessage(
      ctx,
      `🎨 *Thumbnail API Response*

\`\`\`json
${pretty}
\`\`\``
    );
  }

  // Case 1: API returns image directly
  if (res.status >= 200 && res.status < 300 && ct.startsWith('image/')) {
    apiMeta.ok = true;
    apiMeta.note = "API returned image directly";
    const buf = Buffer.from(res.data);
    await ctx.replyWithPhoto(
      { source: buf },
      { caption: `🖼️ YouTube Thumbnail

🔗 ${ytUrl}` }
    );
    await sendJsonResponse();
    return;
  }

  // Case 2: API returns JSON (or text) with an image URL inside
  let jsonObj = null;
  let rawText = null;
  try {
    rawText = Buffer.from(res.data || '').toString('utf-8');
    jsonObj = JSON.parse(rawText);
  } catch (_) {}

  const foundUrl = findFirstUrlDeep(jsonObj);
  if (foundUrl) {
    apiMeta.ok = true;
    apiMeta.extractedImageUrl = foundUrl;
    apiMeta.note = "Extracted image URL from JSON response";
    const imgRes = await axios.get(foundUrl, {
      timeout: 45000,
      responseType: 'arraybuffer',
      validateStatus: () => true,
      headers: { 'accept': 'image/*,*/*;q=0.8', 'user-agent': 'Mozilla/5.0' }
    });

    const imgCt = String(imgRes.headers?.['content-type'] || '').toLowerCase();
    if (imgRes.status >= 200 && imgRes.status < 300 && imgCt.startsWith('image/')) {
      const buf = Buffer.from(imgRes.data);
      await ctx.replyWithPhoto(
        { source: buf },
        { caption: `🖼️ YouTube Thumbnail

🔗 ${ytUrl}` }
      );
      await sendJsonResponse({ apiJson: jsonObj ?? undefined });
      return;
    }

    // If image fetch failed, still show response
    apiMeta.ok = false;
    apiMeta.note = `Found image URL but failed to download image (status=${imgRes.status}, ct=${imgCt})`;
    await sendJsonResponse({ apiJson: jsonObj ?? undefined });
    throw new Error(apiMeta.note);
  }

  // Case 3: last resort – try letting Telegram fetch by URL (sometimes works)
  try {
    apiMeta.ok = true;
    apiMeta.note = "Telegram fetched image by URL (fallback)";
    await ctx.replyWithPhoto(thumbApi, { caption: `🖼️ YouTube Thumbnail

🔗 ${ytUrl}` });
    await sendJsonResponse({ apiText: rawText ?? undefined });
    return;
  } catch (_) {}

  apiMeta.ok = false;
  apiMeta.note = `Thumbnail API did not return a usable image. status=${res.status} ct=${ct}`;
  await sendJsonResponse({ apiText: rawText ?? undefined });
  throw new Error(apiMeta.note);
}




// NEW: Pakistani Government Number Information API
async function getPakistaniGovtNumberInfo(number) {
  try {
    const response = await axios.post(
      'https://govt-pakistan-number-info.vercel.app/search',
      { query: number.toString() },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.success) {
      return { 
        success: true, 
        data: response.data.results,
        count: response.data.count || 0
      };
    } else {
      return { 
        success: false, 
        error: response.data.error || 'No records found' 
      };
    }
  } catch (error) {
    console.error('Error calling Pakistani government number API:', error);
    return { 
      success: false, 
      error: 'Failed to fetch Pakistani government number information' 
    };
  }
}

async function validateEmail(email) {
  try {
    const response = await axios.get(`https://emailvalidation.io/api/verify?email=${encod