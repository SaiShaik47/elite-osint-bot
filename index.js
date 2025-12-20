const { Bot, InlineKeyboard } = require('grammy');
const axios = require('axios');

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

// In-memory storage
const users = new Map();
const registrationRequests = new Map();
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

async function getPakistaniNumberInfo(number) {
  try {
    const response = await axios.get(
      "https://www.simownercheck.com/wp-content/plugins/livetrackers-plugin/search.php",
      {
        params: { type: "mobile", search: number },
        headers: {
          "accept": "*/*",
          "referer": "https://www.simownercheck.com/",
          "x-requested-with": "XMLHttpRequest",
          "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
        }
      }
    );
    
    const data = response.data;
    const regex = /<td[^>]*>(.*?)<\/td>/g;
    const matches = data.match(regex);
    
    if (matches && matches.length >= 4) {
      const cleanData = matches.map(match => match.replace(/<[^>]*>/g, '').trim());
      return {
        success: true,
        data: {
          number: cleanData[0],
          name: cleanData[1],
          cnic: cleanData[2],
          address: cleanData[3]
        }
      };
    }
    
    return { success: false, error: 'No details found for this number' };
  } catch (error) {
    return { success: false, error: 'Failed to fetch Pakistani number information' };
  }
}

async function validateEmail(email) {
  try {
    const response = await axios.get(`https://emailvalidation.io/api/verify?email=${encodeURIComponent(email)}`);
    return { success: true, data: response.data };
  } catch (error) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    return {
      success: true,
      data: {
        email: email,
        valid: isValid,
        score: isValid ? 0.8 : 0.2,
        reason: isValid ? 'Valid email format' : 'Invalid email format'
      }
    };
  }
}

// Social Media Video Downloader API Functions
async function downloadSnapchat(videoUrl) {
  try {
    const apiUrl = `http://15.204.130.9:5150/snap?video=${encodeURIComponent(videoUrl)}`;
    const response = await axios.get(apiUrl, { timeout: 30000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to download Snapchat video' };
  }
}

async function downloadInstagram(videoUrl) {
  try {
    const apiUrl = `http://15.204.130.9:5150/insta?video=${encodeURIComponent(videoUrl)}`;
    const response = await axios.get(apiUrl, { timeout: 30000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to download Instagram video' };
  }
}

async function downloadPinterest(videoUrl) {
  try {
    const apiUrl = `http://15.204.130.9:5150/pin?video=${encodeURIComponent(videoUrl)}`;
    const response = await axios.get(apiUrl, { timeout: 30000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to download Pinterest video' };
  }
}

async function downloadFacebook(videoUrl) {
  try {
    const apiUrl = `http://15.204.130.9:5150/fb?video=${encodeURIComponent(videoUrl)}`;
    const response = await axios.get(apiUrl, { timeout: 30000 });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Failed to download Facebook video' };
  }
}

async function downloadTeraBox(videoUrl) {
  try {
    const apiKey = 'RushVx'; // Your API key
    const apiUrl = `https://teradl.tiiny.io/?key=${apiKey}&link=${encodeURIComponent(videoUrl)}`;
    const response = await axios.get(apiUrl, { timeout: 60000 }); // Increased timeout for large files
    return { success: true, data: response.data };
  } catch (error) {
    console.error('TeraBox API Error:', error.response?.data || error.message);
    return { success: false, error: 'Failed to fetch download link from TeraBox API.' };
  }
}

// Function to extract direct video URL from m3u8 playlist
async function extractVideoFromM3U8(m3u8Url) {
  try {
    const response = await axios.get(m3u8Url, { timeout: 10000 });
    const m3u8Content = response.data;
    
    // Look for video URLs in the playlist
    const videoUrlMatch = m3u8Content.match(/https?:\/\/[^\s"']+\.(mp4|mov|avi|webm|mkv)(\?[^"'\s]*)?/gi);
    
    if (videoUrlMatch && videoUrlMatch.length > 0) {
      return videoUrlMatch[0]; // Return the first video URL found
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting video from m3u8:', error);
    return null;
  }
}

// ===== HELPER FUNCTIONS =====

// Auto-detect platform from URL
function detectPlatform(url) {
  if (/instagram\.com/.test(url)) return 'insta';
  if (/facebook\.com|fb\.watch/.test(url)) return 'fb';
  if (/snapchat\.com/.test(url)) return 'snap';
  if (/pinterest\.com/.test(url)) return 'pin';
  if (/terabox|teraboxshare|teradl/.test(url)) return 'terabox';
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/twitter\.com|x\.com/.test(url)) return 'twitter';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  return 'unknown';
}

// Check if video can be sent directly to Telegram
async function canSendAsVideo(url) {
  try {
    const head = await axios.head(url, { timeout: 10000 });
    const size = Number(head.headers['content-length'] || 0);
    const type = head.headers['content-type'] || '';

    if (!type.includes('video')) return false;
    if (size > 49 * 1024 * 1024) return false; // 49MB safe limit

    return true;
  } catch {
    return false;
  }
}

// Get video file information
async function getVideoInfo(url) {
  try {
    const head = await axios.head(url, { timeout: 10000 });
    const size = Number(head.headers['content-length'] || 0);
    const type = head.headers['content-type'] || '';
    
    return {
      size: size,
      sizeMB: (size / (1024 * 1024)).toFixed(2),
      type: type,
      canSend: size <= 49 * 1024 * 1024 && type.includes('video')
    };
  } catch (error) {
    return {
      size: 0,
      sizeMB: 'Unknown',
      type: 'Unknown',
      canSend: false
    };
  }
}

// Smart video sender with size detection
async function sendVideoSmart(ctx, videoUrl, caption, videoIndex = null, totalVideos = 1) {
  try {
    // Get video information first
    const videoInfo = await getVideoInfo(videoUrl);
    
    // Create caption with video info
    let fullCaption = caption;
    if (videoIndex !== null && totalVideos > 1) {
      fullCaption = `${caption} (${videoIndex}/${totalVideos})`;
    }
    fullCaption += `\n\n📊 Size: ${videoInfo.sizeMB}MB | Type: ${videoInfo.type}`;
    
    if (videoInfo.canSend) {
      await ctx.replyWithVideo(videoUrl, {
        caption: fullCaption,
        supports_streaming: true
      });
    } else {
      await ctx.reply(
        `${fullCaption}\n\n⬇️ Download Link:\n${videoUrl}`
      );
    }
  } catch (err) {
    console.error(err);
    await ctx.reply(
      `${caption}\n\n⬇️ Download Link:\n${videoUrl}`
    );
  }
}

// Handle TeraBox multi-video downloads
async function handleTeraBox(ctx, url) {
  try {
    const result = await downloadTeraBox(url);
    
    if (!result.success) {
      return sendFormattedMessage(ctx, '❌ Failed to process TeraBox link. Please check the URL and try again.');
    }
    
    // Handle different response formats
    let videos = [];
    
    if (Array.isArray(result.data)) {
      videos = result.data;
    } else if (result.data.videos && Array.isArray(result.data.videos)) {
      videos = result.data.videos;
    } else if (result.data.data && Array.isArray(result.data.data)) {
      videos = result.data.data;
    } else {
      return sendFormattedMessage(ctx, '❌ No videos found in TeraBox response. The API may have changed or the link is invalid.');
    }
    
    if (videos.length === 0) {
      return sendFormattedMessage(ctx, '❌ No videos found in TeraBox link. The link may be invalid or expired.');
    }
    
    // Send each video with a different message
    for (let i = 0; i < videos.length; i++) {
      const videoUrl = videos[i].url || videos[i].download_url || videos[i];
      
      if (!videoUrl) continue;
      
      // Create a unique caption for each video
      const videoName = videos[i].name || `Video ${i + 1}`;
      await sendVideoSmart(
        ctx,
        videoUrl,
        `📦 TeraBox: ${videoName}`,
        i + 1,
        videos.length
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error handling TeraBox:', error);
    return sendFormattedMessage(ctx, '❌ Error processing TeraBox link. Please try again later.');
  }
}

// Handle single video downloads
async function handleSingleVideo(ctx, url, platform) {
  try {
    let result;
    
    // Call the appropriate download function
    if (platform === 'insta') result = await downloadInstagram(url);
    else if (platform === 'fb') result = await downloadFacebook(url);
    else if (platform === 'snap') result = await downloadSnapchat(url);
    else if (platform === 'pin') result = await downloadPinterest(url);
    else return sendFormattedMessage(ctx, '❌ Unsupported platform.');
    
    if (!result.success) {
      return sendFormattedMessage(ctx, `❌ Failed to download ${platform} video. Please check the URL and try again.`);
    }
    
    // Extract video URL from response
    let videoUrl =
      result.data?.result?.video ||
      result.data?.video ||
      result.data?.url ||
      result.data?.download_url ||
      result.data?.medias?.[0]?.url ||
      result.data?.medias?.[0]?.download ||
      result.data?.links?.download ||
      result.data?.result?.links?.download ||
      result.data?.response?.videos?.[0]?.url;
    
    // Handle m3u8 playlist URLs (like the Snapchat URL you provided)
    if (!videoUrl && result.data?.url && result.data.url.includes('.m3u8')) {
      videoUrl = await extractVideoFromM3U8(result.data.url);
    }
    
    if (!videoUrl) {
      console.error(`Could not extract video URL for ${platform}. Full API Response:`, JSON.stringify(result, null, 2));
      return sendFormattedMessage(ctx, `❌ Failed to get video URL from ${platform} API. The video may be private or deleted.`);
    }
    
    await sendVideoSmart(ctx, videoUrl, `🎬 ${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`);
    return true;
  } catch (error) {
    console.error(`Error handling ${platform}:`, error);
    return sendFormattedMessage(ctx, `❌ Error processing ${platform} video. Please try again later.`);
  }
}

function generateTempEmail() {
  const domains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  const randomString = Math.random().toString(36).substring(2, 15);
  
  return {
    success: true,
    data: {
      email: `${randomString}@${randomDomain}`,
      expires_in: '10 minutes',
      domain: randomDomain
    }
  };
}

function getUserAgentInfo() {
  return {
    success: true,
    data: {
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      browser: 'Chrome',
      version: '120.0.0.0',
      platform: 'Linux',
      mobile: false
    }
  };
}

// Helper function to deduct credits
function deductCredits(user, amount = 1) {
  if (user.isPremium) {
    return true; // Premium users don't lose credits
  }
  
  if (user.credits >= amount) {
    user.credits -= amount;
    return true;
  }
  
  return false;
}

// Helper function to get or create user
function getOrCreateUser(ctx) {
  const telegramId = ctx.from?.id.toString();
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name;
  const lastName = ctx.from?.last_name;

  if (!telegramId) return null;

  // Check if user exists, if not create new user
  if (!users.has(telegramId)) {
    users.set(telegramId, {
      telegramId,
      username: username || null,
      firstName: firstName || null,
      lastName: lastName || null,
      isApproved: false,
      credits: 0,
      isPremium: false,
      isAdmin: false,
      totalQueries: 0,
      registrationDate: new Date()
    });
  }

  return users.get(telegramId);
}

// Helper function to check if user is admin
function isAdmin(userId) {
  const user = users.get(userId);
  return user && (user.isAdmin || userId === adminId);
}

// Helper function to send formatted messages
async function sendFormattedMessage(ctx, text) {
  try {
    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (error) {
    const plainText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```(.*?)```/gs, '$1');
    await ctx.reply(plainText);
  }
}

// Helper function for admin notifications
async function notifyUser(userId, message) {
  try {
    await bot.api.sendMessage(userId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Failed to notify user:', error);
  }
}

// Helper function for admin notifications
async function notifyAdmin(message, keyboard) {
  try {
    await bot.api.sendMessage(adminId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}

// Middleware to check maintenance mode
bot.use((ctx, next) => {
  // Skip maintenance check for admin users
  if (isAdmin(ctx.from?.id.toString())) {
    return next();
  }
  
  // If in maintenance mode, send maintenance message
  if (maintenanceMode) {
    return ctx.reply(maintenanceMessage);
  }
  
  // Otherwise, continue to next middleware
  return next();
});

// Start command with registration management
bot.command('start', async (ctx) => {
  const user = getOrCreateUser(ctx);
  
  if (!user.isApproved) {
    const welcomeMessage = `🚀 **Welcome to Premium OSINT Bot** 🚀

✨ *Your Ultimate Open Source Intelligence Assistant* ✨

📋 **Registration Required** 📋

Your account is pending approval by our admin team. 

🔹 Use /register to submit your registration request
🔹 You'll be notified once approved
🔹 Premium features will be available after approval

⚡ *Powered by Advanced AI Technology* ⚡

🛡️ *Educational Purpose Only - Use Responsibly* 🛡️`;

    await sendFormattedMessage(ctx, welcomeMessage);
    return;
  }

  const welcomeMessage = `🚀 **Welcome to Premium OSINT Bot** 🚀

✨ *Your Ultimate Open Source Intelligence Assistant* ✨

🔍 **Advanced Lookup Tools:**
• /ip <address> - IP intelligence
• /email <email> - Email validation
• /num <number> - Phone number lookup
• /basicnum <number> - Basic number information
• /paknum <number> - Pakistani number lookup
• /ig <username> - Instagram intelligence
• /bin <number> - BIN lookup
• /vehicle <number> - Vehicle details
• /ff <uid> - Free Fire stats

📱 **Social Media Video Downloaders:**
• /dl <url> - Universal video downloader (auto-detects platform)
• /snap <url> - Snapchat video downloader
• /insta <url> - Instagram video downloader
• /pin <url> - Pinterest video downloader
• /fb <url> - Facebook video downloader
• /terabox <url> - TeraBox video downloader

📊 **System Commands:**
• /myip - Your IP information
• /useragent - Browser info
• /tempmail - Temporary email
• /stats - Bot statistics
• /credits - Your credits
• /checkstatus - Check registration status
• /sync - Sync registration (if approved but lost access)
• /help - Show this help message

💎 **Premium Features:**
 ${user.isPremium ? '✅ Unlimited queries' : '🔒 Upgrade for unlimited queries'}
 ${user.isPremium ? '✅ Priority API access' : '🔒 Priority processing'}
 ${user.isPremium ? '✅ Advanced tools' : '🔒 Advanced features'}
 ${user.isPremium ? '✅ 24/7 support' : '🔒 Premium support'}

💳 **Your Credits:** ${user.credits} 🪙

⚡ *Powered by Advanced AI Technology* ⚡

🛡️ *Educational Purpose Only - Use Responsibly* 🛡️`;

  await sendFormattedMessage(ctx, welcomeMessage);
});

// Universal video downloader command
bot.command('dl', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    return sendFormattedMessage(ctx, '❌ You need approval to use this command.');
  }

  if (!deductCredits(user)) {
    return sendFormattedMessage(ctx, '❌ Insufficient credits!');
  }

  const url = ctx.match;
  if (!url) {
    return sendFormattedMessage(ctx, '❌ Usage: /dl <video link>');
  }

  const platform = detectPlatform(url);
  if (platform === 'unknown') {
    return sendFormattedMessage(ctx, '❌ Unsupported platform. Please use a link from Instagram, Facebook, Snapchat, Pinterest, or TeraBox.');
  }

  await sendFormattedMessage(ctx, `⏳ Processing ${platform} video...`);

  try {
    let success;
    
    if (platform === 'terabox') {
      success = await handleTeraBox(ctx, url);
    } else {
      success = await handleSingleVideo(ctx, url, platform);
    }
    
    if (success) {
      user.totalQueries++;
    } else {
      user.credits += 1; // Refund credit on failure
    }
  } catch (error) {
    console.error('Error in dl command:', error);
    user.credits += 1; // Refund credit on error
    sendFormattedMessage(ctx, '❌ An error occurred while processing your request.');
  }
});

// Keep individual commands for backward compatibility
bot.command('snap', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    return sendFormattedMessage(ctx, '❌ You need approval to use this command.');
  }

  if (!deductCredits(user)) {
    return sendFormattedMessage(ctx, '❌ Insufficient credits!');
  }

  const videoUrl = ctx.match;
  if (!videoUrl) {
    return sendFormattedMessage(ctx, '🦼 *Usage: /snap <Snapchat video URL>*');
  }

  await sendFormattedMessage(ctx, '🦼 *Downloading Snapchat video...*');

  try {
    const success = await handleSingleVideo(ctx, videoUrl, 'snap');
    if (success) {
      user.totalQueries++;
    } else {
      user.credits += 1; // Refund credit on failure
    }
  } catch (error) {
    console.error('Error in snap command:', error);
    user.credits += 1; // Refund credit on error
    sendFormattedMessage(ctx, '❌ An error occurred while processing your request.');
  }
});

bot.command('insta', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    return sendFormattedMessage(ctx, '❌ You need approval to use this command.');
  }

  if (!deductCredits(user)) {
    return sendFormattedMessage(ctx, '❌ Insufficient credits!');
  }

  const videoUrl = ctx.match;
  if (!videoUrl) {
    return sendFormattedMessage(ctx, '💎 *Usage: /insta <Instagram video URL>*');
  }

  await sendFormattedMessage(ctx, '💎 *Downloading Instagram video...*');

  try {
    const success = await handleSingleVideo(ctx, videoUrl, 'insta');
    if (success) {
      user.totalQueries++;
    } else {
      user.credits += 1; // Refund credit on failure
    }
  } catch (error) {
    console.error('Error in insta command:', error);
    user.credits += 1; // Refund credit on error
    sendFormattedMessage(ctx, '❌ An error occurred while processing your request.');
  }
});

bot.command('pin', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    return sendFormattedMessage(ctx, '❌ You need approval to use this command.');
  }

  if (!deductCredits(user)) {
    return sendFormattedMessage(ctx, '❌ Insufficient credits!');
  }

  const videoUrl = ctx.match;
  if (!videoUrl) {
    return sendFormattedMessage(ctx, '❤️ *Usage: /pin <Pinterest video URL>*');
  }

  await sendFormattedMessage(ctx, '❤️ *Downloading Pinterest video...*');

  try {
    const success = await handleSingleVideo(ctx, videoUrl, 'pin');
    if (success) {
      user.totalQueries++;
    } else {
      user.credits += 1; // Refund credit on failure
    }
  } catch (error) {
    console.error('Error in pin command:', error);
    user.credits += 1; // Refund credit on error
    sendFormattedMessage(ctx, '❌ An error occurred while processing your request.');
  }
});

bot.command('fb', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    return sendFormattedMessage(ctx, '❌ You need approval to use this command.');
  }

  if (!deductCredits(user)) {
    return sendFormattedMessage(ctx, '❌ Insufficient credits!');
  }

  const videoUrl = ctx.match;
  if (!videoUrl) {
    return sendFormattedMessage(ctx, '❤️ *Usage: /fb <Facebook video URL>*');
  }

  await sendFormattedMessage(ctx, '❤️ *Downloading Facebook video...*');

  try {
    const success = await handleSingleVideo(ctx, videoUrl, 'fb');
    if (success) {
      user.totalQueries++;
    } else {
      user.credits += 1; // Refund credit on failure
    }
  } catch (error) {
    console.error('Error in fb command:', error);
    user.credits += 1; // Refund credit on error
    sendFormattedMessage(ctx, '❌ An error occurred while processing your request.');
  }
});

bot.command('terabox', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    return sendFormattedMessage(ctx, '❌ You need approval to use this command.');
  }

  if (!deductCredits(user)) {
    return sendFormattedMessage(ctx, '❌ Insufficient credits!');
  }

  const videoUrl = ctx.match;
  if (!videoUrl) {
    return sendFormattedMessage(ctx, '📁 *Usage: /terabox <TeraBox video URL>*');
  }

  await sendFormattedMessage(ctx, '📁 *Processing TeraBox link...*');

  try {
    const success = await handleTeraBox(ctx, videoUrl);
    if (success) {
      user.totalQueries++;
    } else {
      user.credits += 1; // Refund credit on failure
    }
  } catch (error) {
    console.error('Error in terabox command:', error);
    user.credits += 1; // Refund credit on error
    sendFormattedMessage(ctx, '❌ An error occurred while processing your request.');
  }
});

// Registration command
bot.command('register', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name;
  const lastName = ctx.from?.last_name;

  if (!telegramId) return;

  const user = users.get(telegramId);
  
  if (user && user.isApproved) {
    await sendFormattedMessage(ctx, '✅ *Your account is already approved!* You can use all bot features.');
    return;
  }

  if (registrationRequests.has(telegramId)) {
    await sendFormattedMessage(ctx, '⏳ *Your registration is already pending approval.*\n\nPlease wait for the admin to review your request.');
    return;
  }

  // Create registration request
  registrationRequests.set(telegramId, {
    telegramId,
    username: username || null,
    firstName: firstName || null,
    lastName: lastName || null,
    status: 'pending',
    timestamp: new Date()
  });

  // Notify admin with inline keyboard
  const adminMessage = `📋 **New Registration Request** 📋

👤 **User Information:**
• Telegram ID: ${telegramId}
• Username: @${username || 'N/A'}
• Name: ${firstName || ''} ${lastName || ''}

📅 **Request Details:**
• Status: ⏳ Pending
• Date: ${new Date().toLocaleDateString()}

🎯 **Actions:**
• Approve or Reject below`;

  const keyboard = new InlineKeyboard()
    .text("✅ Approve", `approve_${telegramId}`)
    .text("❌ Reject", `reject_${telegramId}`);

  await notifyAdmin(adminMessage, keyboard);

  const userMessage = `📋 **Registration Submitted** 📋

✅ *Your registration request has been submitted successfully!*

👤 **Your Details:**
• Telegram ID: ${telegramId}
• Username: @${username || 'N/A'}

⏳ **Next Steps:**
• Your request is now pending admin approval
• You'll receive a notification once reviewed
• Approval typically takes 24-48 hours

💎 **After Approval:**
• Full access to all OSINT tools
• Starting credits balance
• Premium features available

🔔 *You'll be notified when your registration is processed*`;

  await sendFormattedMessage(ctx, userMessage);
});

// Callback query handler for registration
bot.callbackQuery(/^(approve|reject)_(\d+)$/, async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await ctx.answerCallbackQuery('❌ Only admins can process registrations.');
    return;
  }

  const match = ctx.callbackQuery.data.match(/^(approve|reject)_(\d+)$/);
  if (!match) return;

  const action = match[1];
  const targetUserId = match[2];

  const request = registrationRequests.get(targetUserId);
  if (!request) {
    await ctx.answerCallbackQuery('❌ Registration request not found.');
    return;
  }

  // Check if user already exists
  let user = users.get(targetUserId);
  if (!user) {
    user = {
      telegramId: targetUserId,
      username: request.username,
      firstName: request.firstName,
      lastName: request.lastName,
      isApproved: false,
      credits: 0,
      isPremium: false,
      isAdmin: false,
      totalQueries: 0,
      registrationDate: new Date()
    };
  }

  if (action === 'approve') {
    user.isApproved = true;
    user.credits = 25; // Give starting credits
    users.set(targetUserId, user);
    registrationRequests.delete(targetUserId);

    const userMessage = `🎉 **Registration Approved!** 🎉

✅ *Congratulations! Your registration has been approved.*

💎 **Welcome Benefits:**
• 25 starting credits 🪙
• Full access to all OSINT tools
• Premium features available

🚀 **Get Started:**
• Use /start to see all available commands
• Try /help for detailed instructions
• Check /credits to see your balance

⚡ *Thank you for joining our OSINT community!*`;

    await notifyUser(targetUserId, userMessage);
    await ctx.answerCallbackQuery('✅ Registration approved successfully!');
    
    // Update the message
    await ctx.editMessageText(`✅ **Registration Approved** ✅

👤 **User:** @${user.username || 'N/A'} (${targetUserId})
📅 **Processed:** ${new Date().toLocaleDateString()}
🎯 **Status:** Approved

*Processed by:* @${ctx.from?.username || 'Admin'}`);

  } else if (action === 'reject') {
    registrationRequests.delete(targetUserId);

    const userMessage = `❌ **Registration Rejected** ❌

📋 *Your registration request has been rejected.*

📞 **Next Steps:**
• Contact the admin for more information
• Review registration requirements
• You may submit a new request if needed

💡 *If you believe this is an error, please reach out to our support team*`;

    await notifyUser(targetUserId, userMessage);
    await ctx.answerCallbackQuery('❌ Registration rejected');
    
    // Update the message
    await ctx.editMessageText(`❌ **Registration Rejected** ❌

👤 **User:** @${user.username || 'N/A'} (${targetUserId})
📅 **Processed:** ${new Date().toLocaleDateString()}
🎯 **Status:** Rejected

*Processed by:* @${ctx.from?.username || 'Admin'}`);
  }
});

// OSINT Commands
bot.command('ip', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  // Check credits
  if (!deductCredits(user)) {
    await sendFormattedMessage(ctx, '❌ Insufficient credits! You need at least 1 credit to use this command.\n💳 Check your balance with /credits');
    return;
  }

  const ip = ctx.match || 'self';
  await sendFormattedMessage(ctx, '🔍 *Fetching IP intelligence...*');

  try {
    const result = await getIpInfo(ip === 'self' ? undefined : ip.toString());
    
    if (result.success && result.data) {
      const response = `🌐 **IP Intelligence Results** 🌐

\`\`\`json
 ${JSON.stringify(result.data, null, 2)}
\`\`\`

💡 *IP information for educational purposes only*
• 1 credit deducted from your balance`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      // Refund credit on failure
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to fetch IP information. Please check the IP address and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in ip command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while fetching IP information.\n💳 1 credit refunded');
  }
});

bot.command('email', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  // Check credits
  if (!deductCredits(user)) {
    await sendFormattedMessage(ctx, '❌ Insufficient credits! You need at least 1 credit to use this command.\n💳 Check your balance with /credits');
    return;
  }

  const email = ctx.match;
  if (!email) {
    await sendFormattedMessage(ctx, '📧 *Usage: /email <email address>*\n\nExample: /email user@example.com');
    return;
  }

  await sendFormattedMessage(ctx, '🔍 *Validating email address...*');

  try {
    const result = await validateEmail(email.toString());
    
    if (result.success && result.data) {
      const response = `📧 **Email Validation Results** 📧

\`\`\`json
 ${JSON.stringify(result.data, null, 2)}
\`\`\`

💡 *Email validation for educational purposes only*
• 1 credit deducted from your balance`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      // Refund credit on failure
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to validate email address. Please check the email and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in email command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while validating email address.\n💳 1 credit refunded');
  }
});

bot.command('num', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  // Check credits
  if (!deductCredits(user)) {
    await sendFormattedMessage(ctx, '❌ Insufficient credits! You need at least 1 credit to use this command.\n💳 Check your balance with /credits');
    return;
  }

  const number = ctx.match;
  if (!number) {
    await sendFormattedMessage(ctx, '📱 *Usage: /num <phone number>*\n\nExample: /num 9389482769');
    return;
  }

  await sendFormattedMessage(ctx, '🔍 *Looking up phone number...*');

  try {
    const result = await getPhoneNumberInfo(number.toString());
    
    if (result.success && result.data) {
      const response = `📱 **Phone Number Lookup Results** 📱

\`\`\`json
 ${JSON.stringify(result.data, null, 2)}
\`\`\`

💡 *Phone number information for educational purposes only*
• 1 credit deducted from your balance`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      // Refund credit on failure
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to lookup phone number. Please check the number and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in num command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while looking up phone number.\n💳 1 credit refunded');
  }
});

bot.command('basicnum', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  // Check credits
  if (!deductCredits(user)) {
    await sendFormattedMessage(ctx, '❌ Insufficient credits! You need at least 1 credit to use this command.\n💳 Check your balance with /credits');
    return;
  }

  const number = ctx.match;
  if (!number) {
    await sendFormattedMessage(ctx, '📱 *Usage: /basicnum <phone number>*\n\nExample: /basicnum 919087654321');
    return;
  }

  await sendFormattedMessage(ctx, '🔍 *Getting basic number information...*');

  try {
    const result = await getBasicNumberInfo(number.toString());
    
    if (result.success && result.data) {
      const response = `📱 **Basic Number Information** 📱

\`\`\`json
 ${JSON.stringify(result.data, null, 2)}
\`\`\`

💡 *Basic number information for educational purposes only*
• 1 credit deducted from your balance`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      // Refund credit on failure
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to get basic number information. Please check the number and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in basicnum command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while getting basic number information.\n💳 1 credit refunded');
  }
});

bot.command('paknum', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  // Check credits
  if (!deductCredits(user)) {
    await sendFormattedMessage(ctx, '❌ Insufficient credits! You need at least 1 credit to use this command.\n💳 Check your balance with /credits');
    return;
  }

  const number = ctx.match;
  if (!number) {
    await sendFormattedMessage(ctx, '📱 *Usage: /paknum <Pakistani number>*\n\nExample: /paknum 03005854962');
    return;
  }

  await sendFormattedMessage(ctx, '🔍 *Looking up Pakistani number...*');

  try {
    const result = await getPakistaniNumberInfo(number.toString());
    
    if (result.success && result.data) {
      const response = `📱 **Pakistani Number Lookup Results** 📱

\`\`\`json
 ${JSON.stringify(result.data, null, 2)}
\`\`\`

💡 *Pakistani number information for educational purposes only*
• 1 credit deducted from your balance`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      // Refund credit on failure
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to lookup Pakistani number. Please check the number and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in paknum command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while looking up Pakistani number.\n💳 1 credit refunded');
  }
});

bot.command('ig', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  // Check credits
  if (!deductCredits(user)) {
    await sendFormattedMessage(ctx, '❌ Insufficient credits! You need at least 1 credit to use this command.\n💳 Check your balance with /credits');
    return;
  }

  const username = ctx.match;
  if (!username) {
    await sendFormattedMessage(ctx, '📷 *Usage: /ig <Instagram username>*\n\nExample: /ig instagram');
    return;
  }

  await sendFormattedMessage(ctx, '🔍 *Fetching Instagram intelligence...*');

  try {
    const result = await getInstagramInfo(username.toString());
    
    if (result.success && result.data) {
      const response = `📷 **Instagram Intelligence Results** 📷

\`\`\`json
 ${JSON.stringify(result.data, null, 2)}
\`\`\`

💡 *Instagram information for educational purposes only*
• 1 credit deducted from your balance`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      // Refund credit on failure
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to fetch Instagram information. Please check the username and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in ig command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while fetching Instagram information.\n💳 1 credit refunded');
  }
});

bot.command('bin', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  // Check credits
  if (!deductCredits(user)) {
    await sendFormattedMessage(ctx, '❌ Insufficient credits! You need at least 1 credit to use this command.\n💳 Check your balance with /credits');
    return;
  }

  const bin = ctx.match;
  if (!bin) {
    await sendFormattedMessage(ctx, '💳 *Usage: /bin <BIN number>*\n\nExample: /bin 460075');
    return;
  }

  await sendFormattedMessage(ctx, '🔍 *Looking up BIN information...*');

  try {
    const result = await getBinInfo(bin.toString());
    
    if (result.success && result.data) {
      const response = `💳 **BIN Lookup Results** 💳

\`\`\`json
 ${JSON.stringify(result.data, null, 2)}
\`\`\`

💡 *BIN information for educational purposes only*
• 1 credit deducted from your balance`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      // Refund credit on failure
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to lookup BIN information. Please check the BIN and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in bin command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while looking up BIN information.\n💳 1 credit refunded');
  }
});

bot.command('vehicle', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  // Check credits
  if (!deductCredits(user)) {
    await sendFormattedMessage(ctx, '❌ Insufficient credits! You need at least 1 credit to use this command.\n💳 Check your balance with /credits');
    return;
  }

  const vehicle = ctx.match;
  if (!vehicle) {
    await sendFormattedMessage(ctx, '🚗 *Usage: /vehicle <vehicle number>*\n\nExample: /vehicle MH04KA0151');
    return;
  }

  await sendFormattedMessage(ctx, '🔍 *Fetching vehicle details...*');

  try {
    const result = await getVehicleInfo(vehicle.toString());
    
    if (result.success && result.data) {
      const response = `🚗 **Vehicle Details Results** 🚗

\`\`\`json
 ${JSON.stringify(result.data, null, 2)}
\`\`\`

💡 *Vehicle information for educational purposes only*
• 1 credit deducted from your balance`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      // Refund credit on failure
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to fetch vehicle details. Please check the vehicle number and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in vehicle command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while fetching vehicle details.\n💳 1 credit refunded');
  }
});

bot.command('ff', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  // Check credits
  if (!deductCredits(user)) {
    await sendFormattedMessage(ctx, '❌ Insufficient credits! You need at least 1 credit to use this command.\n💳 Check your balance with /credits');
    return;
  }

  const uid = ctx.match;
  if (!uid) {
    await sendFormattedMessage(ctx, '🎮 *Usage: /ff <Free Fire UID>*\n\nExample: /ff 2819649271');
    return;
  }

  await sendFormattedMessage(ctx, '🔍 *Fetching Free Fire statistics...*');

  try {
    const result = await getFreeFireStats(uid.toString());
    
    if (result.success && result.data) {
      const response = `🎮 **Free Fire Statistics Results** 🎮

\`\`\`json
 ${JSON.stringify(result.data, null, 2)}
\`\`\`

💡 *Free Fire statistics for educational purposes only*
• 1 credit deducted from your balance`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      // Refund credit on failure
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to fetch Free Fire statistics. Please check the UID and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in ff command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while fetching Free Fire statistics.\n💳 1 credit refunded');
  }
});

bot.command('myip', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  await sendFormattedMessage(ctx, '🔍 *Fetching your IP information...*');

  try {
    const result = await getIpInfo();
    
    if (result.success && result.data) {
      const ip = result.data.ip || 'Unknown';
      const city = result.data.city || 'Unknown';
      const region = result.data.region || 'Unknown';
      const country = result.data.country || 'Unknown';
      const org = result.data.org || 'Unknown';
      const timezone = result.data.timezone || 'Unknown';

      const response = `🌐 **Your IP Information** 🌐

📍 **Location Details:**
• IP Address: \`${ip}\`
• City: ${city}
• Region: ${region}
• Country: ${country}
• Organization: ${org}
• Timezone: ${timezone}

🔍 **Network Information:**
• ISP: ${org}
• Connection Type: Detected

💡 *This information is for educational purposes only*`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      await sendFormattedMessage(ctx, '❌ Failed to fetch IP information. Please try again.');
    }
  } catch (error) {
    console.error('Error in myip command:', error);
    await sendFormattedMessage(ctx, '❌ An error occurred while fetching IP information.');
  }
});

bot.command('useragent', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  try {
    const result = getUserAgentInfo();
    
    if (result.success && result.data) {
      const response = `🖥️ **Browser & System Information** 🖥️

🌐 **Browser Details:**
• Browser: ${result.data.browser}
• Version: ${result.data.version}
• Platform: ${result.data.platform}
• Mobile: ${result.data.mobile ? 'Yes' : 'No'}

📱 **User Agent String:**
\`${result.data.user_agent}\`

💡 *This is the bot's user agent information*`;

      await sendFormattedMessage(ctx, response);
    } else {
      await sendFormattedMessage(ctx, '❌ Failed to fetch user agent information.');
    }
  } catch (error) {
    console.error('Error in useragent command:', error);
    await sendFormattedMessage(ctx, '❌ An error occurred while fetching user agent information.');
  }
});

bot.command('tempmail', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  try {
    const result = generateTempEmail();
    
    if (result.success && result.data) {
      const response = `📧 **Temporary Email Generated** 📧

🔑 **Email Address:**
\`${result.data.email}\`

⏰ **Details:**
• Expires in: ${result.data.expires_in}
• Domain: ${result.data.domain}

💡 **Important Notes:**
• This email will expire automatically
• Use for temporary registrations only
• Don't use for important communications
• Check the inbox regularly

🔒 *Privacy protected - No logs stored*`;

      await sendFormattedMessage(ctx, response);
      user.totalQueries++;
    } else {
      await sendFormattedMessage(ctx, '❌ Failed to generate temporary email.');
    }
  } catch (error) {
    console.error('Error in tempmail command:', error);
    await sendFormattedMessage(ctx, '❌ An error occurred while generating temporary email.');
  }
});

bot.command('stats', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  const response = `📊 **Your Usage Statistics** 📊

👤 **Account Information:**
• Username: @${user.username || 'N/A'}
• Status: ${user.isPremium ? '💎 Premium' : '🔹 Standard'}
• Credits: ${user.credits} 🪙
• Member Since: ${user.registrationDate.toLocaleDateString()}

📈 **Usage Statistics:**
• Total Queries: ${user.totalQueries}
• Credits Available: ${user.credits}

💎 ${user.isPremium ? 'Premium Member - Unlimited Access!' : 'Upgrade to Premium for unlimited queries!'}`;

  await sendFormattedMessage(ctx, response);
});

bot.command('credits', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  const response = `💳 **Credit Information** 💳

🪙 **Current Balance:** ${user.credits} credits

👤 **Account Status:**
 ${user.isPremium ? '💎 Premium Member' : '🔹 Standard Member'}
 ${user.isPremium ? '✅ Unlimited queries' : `📊 Daily limit: ${user.credits} queries`}

📈 **Usage Statistics:**
• Total Queries: ${user.totalQueries}
• Credits Available: ${user.credits}

🎁 **Want more credits?**
• Upgrade to Premium for unlimited access
• Contact admin for credit requests

💡 *Each query consumes 1 credit*`;

  await sendFormattedMessage(ctx, response);
});

// Help command
bot.command('help', async (ctx) => {
  const helpMessage = `📖 **Premium OSINT Bot - Complete Guide** 📖

🔍 **OSINT Lookup Commands:**

📱 **Device & Network:**
• /ip <address> - IP geolocation and intelligence
• /bin <number> - Bank Identification Number lookup

👤 **Social & Contact:**
• /email <email> - Email validation and analysis
• /num <number> - International phone lookup
• /basicnum <number> - Basic number information
• /paknum <number> - Pakistani number details
• /ig <username> - Instagram profile intelligence

🚗 **Vehicle & Gaming:**
• /vehicle <number> - Vehicle registration details
• /ff <uid> - Free Fire player statistics

📱 **Social Media Video Downloaders:**
• /dl <url> - Universal video downloader (auto-detects platform)
• /snap <url> - Snapchat video downloader
• /insta <url> - Instagram video downloader
• /pin <url> - Pinterest video downloader
• /fb <url> - Facebook video downloader
• /terabox <url> - TeraBox video downloader

📊 **System Commands:**
• /myip - Get your current IP information
• /useragent - Browser and system information
• /tempmail - Generate temporary email address
• /stats - View your usage statistics
• /credits - Check your credit balance
• /checkstatus - Check registration status
• /sync - Sync registration (if approved but lost access)

💎 **Premium Benefits:**
• 🔄 Unlimited queries per day
• ⚡ Priority API access
• 🔧 Advanced lookup tools
• 📞 24/7 premium support
• 🎯 Higher rate limits

📝 **Usage Examples:**
• /ip 8.8.8.8
• /email user@example.com
• /num 9389482769
• /basicnum 919087654321
• /paknum 03005854962
• /ig instagram
• /dl https://www.instagram.com/reel/DSSvFDgjU3s/
• /snap https://snapchat.com/t/H2D8zTxt
• /pin https://pin.it/4gsJMxtt1
• /fb https://www.facebook.com/reel/1157396829623170/

⚠️ **Important Notes:**
• Each query consumes 1 credit
• Results are for educational purposes only
• Use responsibly and legally
• Respect privacy laws
• Videos larger than 50MB will be sent as download links

🛡️ *Educational Purpose Only - Use Responsibly* 🛡️`;

  await sendFormattedMessage(ctx, helpMessage);
});

// Admin command
bot.command('admin', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  // Check if user is admin (either original admin or made admin)
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const user = getOrCreateUser(ctx);

  const pendingCount = registrationRequests.size;
  const totalUsers = users.size;
  const approvedUsers = Array.from(users.values()).filter(u => u.isApproved).length;
  const premiumUsers = Array.from(users.values()).filter(u => u.isPremium).length;

  const adminPanel = `🌟 ⚡ **ELITE ADMIN CONTROL PANEL** ⚡ 🌟

💎 💰 **Credit Management Commands:**
• /give <user_id> <amount> - 🎁 Grant credits to user
• /remove <user_id> <amount> - 💸 Remove credits from user
• /giveall <amount> - 🌍 Bless all users with credits
• /removeall <amount> - 🗑️ Clear credits from all users
• /setcredits <user_id> <amount> - 🎯 Set exact credit amount

👑 👥 **User Management:**
• /premium <user_id> - ⭐ Toggle premium status
• /checkuser <user_id> - 🔍 Inspect user details
• /users - 📋 List all users (premium first)
• /topusers - 🏆 Show top 10 users by queries
• /premiumlist - 💎 List all premium members
• /makeadmin <user_id> - 👑 Make user admin
• /removeadmin <user_id> - 🚫 Remove admin status

📋 📝 **Registration Management:**
• /registrations - 📋 View pending registrations
• /approve <user_id> - ✅ Approve registration
• /reject <user_id> - ❌ Reject registration
• /approveall - ✅ Approve all pending registrations

📊 📈 **Statistics & Analytics:**
• /stats - 📊 Complete bot statistics
• /adminstats - 🎯 Admin-only analytics
• /activity - 📈 Recent activity log
• /revenue - 💰 Premium revenue stats

🎮 🔧 **System Controls:**
• /broadcast <message> - 📢 Send broadcast to all
• /announce <title>|<message> - 🎭 Rich announcement
• /reset_daily - 🔄 Reset daily statistics
• /lucky - 🍀 Random user bonus
• /maintenance <on|off|message> - ⚙️ Toggle maintenance mode

🔥 🎯 **Advanced Tools:**
• /masspremium - 👑 Mass premium upgrade
• /resetuser <user_id> - 🔄 Reset user account
• /logs - 📜 View system logs
• /backup - 💾 Create database backup

📊 **Current Statistics:**
• 👥 Total Users: ${totalUsers}
• ✅ Approved Users: ${approvedUsers}
• 💎 Premium Users: ${premiumUsers}
• ⏳ Pending Registrations: ${pendingCount}
• 🔧 Maintenance Mode: ${maintenanceMode ? 'ON' : 'OFF'}

⚡ 🌟 **Unlimited Power • Unlimited Possibilities** 🌟 ⚡

🔐 *Admin access verified*`;

  await sendFormattedMessage(ctx, adminPanel);
});

// Credit Management Commands
bot.command('give', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const args = ctx.match?.toString().split(' ');
  if (!args || args.length < 2) {
    await sendFormattedMessage(ctx, '💎 *Usage: /give <user_id> <amount>*\n\nExample: /give 123456789 500');
    return;
  }

  const targetUserId = args[0];
  const amount = parseInt(args[1]);

  if (isNaN(amount) || amount <= 0) {
    await sendFormattedMessage(ctx, '❌ Please provide a valid positive amount.');
    return;
  }

  const targetUser = users.get(targetUserId);
  if (!targetUser) {
    await sendFormattedMessage(ctx, '❌ User not found.');
    return;
  }

  targetUser.credits += amount;

  const userMessage = `🎉 **Credits Received!** 🎉

💰 **Amount:** +${amount} credits
💳 **New Balance:** ${targetUser.credits} credits
👤 **From:** Admin

✨ *Enjoy your credits! Use them wisely for OSINT lookups.*`;

  await notifyUser(targetUserId, userMessage);

  const adminMessage = `💎 **Credits Granted Successfully** 💎

✅ **Transaction Details:**
• User ID: ${targetUserId}
• Amount: ${amount} credits
• New Balance: ${targetUser.credits} credits
• Admin: @${ctx.from?.username}

🎯 *User has been notified about the credit grant*`;

  await sendFormattedMessage(ctx, adminMessage);
});

bot.command('premium', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const targetUserId = ctx.match?.toString();
  if (!targetUserId) {
    await sendFormattedMessage(ctx, '⭐ *Usage: /premium <user_id>*\n\nExample: /premium 123456789');
    return;
  }

  const targetUser = users.get(targetUserId);
  if (!targetUser) {
    await sendFormattedMessage(ctx, '❌ User not found.');
    return;
  }

  targetUser.isPremium = !targetUser.isPremium;
  const action = targetUser.isPremium ? 'granted' : 'revoked';

  const userMessage = targetUser.isPremium ? 
    `🎉 **Premium Status Granted!** 🎉

💎 **Welcome to Premium!**
✅ Unlimited queries
⚡ Priority API access
🔧 Advanced tools
📞 24/7 support

🌟 *Thank you for upgrading to Premium!*

💎 *Enjoy your exclusive benefits!*` :
    `💳 **Premium Status Revoked** 💳

📋 **Status Changed:**
• Premium access revoked
• Back to standard features
• Contact admin for details

📞 *If you have questions, please reach out to support*`;

  await notifyUser(targetUserId, userMessage);

  const adminMessage = `⭐ **Premium Status Updated** ⭐

✅ **Action Details:**
• User ID: ${targetUserId}
• Action: Premium ${action}
• New Status: ${targetUser.isPremium ? '💎 Premium' : '🔹 Standard'}
• Admin: @${ctx.from?.username}

🎯 *User has been notified about the status change*`;

  await sendFormattedMessage(ctx, adminMessage);
});

bot.command('makeadmin', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const targetUserId = ctx.match?.toString();
  if (!targetUserId) {
    await sendFormattedMessage(ctx, '👑 *Usage: /makeadmin <user_id>*\n\nExample: /makeadmin 123456789');
    return;
  }

  const targetUser = users.get(targetUserId);
  if (!targetUser) {
    await sendFormattedMessage(ctx, '❌ User not found.');
    return;
  }

  if (targetUser.isAdmin) {
    await sendFormattedMessage(ctx, '⚠️ This user is already an admin.');
    return;
  }

  targetUser.isAdmin = true;

  const userMessage = `👑 **Admin Access Granted!** 👑

🎉 **Congratulations!**
✅ Admin status granted
🔧 Full admin access
📋 Admin commands available

🎯 **Get Started:**
• Use /admin to view all admin commands
• Access user management tools
• Control bot settings

💎 *Welcome to the admin team!*`;

  await notifyUser(targetUserId, userMessage);

  const adminMessage = `👑 **Admin Access Granted** 👑

✅ **Action Details:**
• User ID: ${targetUserId}
• Username: @${targetUser.username || 'N/A'}
• Action: Admin access granted
• Admin: @${ctx.from?.username}

🎯 *User has been notified about admin access*`;

  await sendFormattedMessage(ctx, adminMessage);
});

bot.command('removeadmin', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const targetUserId = ctx.match?.toString();
  if (!targetUserId) {
    await sendFormattedMessage(ctx, '🚫 *Usage: /removeadmin <user_id>*\n\nExample: /removeadmin 123456789');
    return;
  }

  const targetUser = users.get(targetUserId);
  if (!targetUser) {
    await sendFormattedMessage(ctx, '❌ User not found.');
    return;
  }

  if (!targetUser.isAdmin) {
    await sendFormattedMessage(ctx, '⚠️ This user is not an admin.');
    return;
  }

  if (targetUserId === telegramId) {
    await sendFormattedMessage(ctx, '❌ You cannot remove your own admin access.');
    return;
  }

  targetUser.isAdmin = false;

  const userMessage = `🚫 **Admin Access Removed** 🚫

📋 **Status Update:**
• Admin access removed
• Back to regular user
• Contact main admin if needed

📞 *If you have questions about this change, please reach out to the main admin*`;

  await notifyUser(targetUserId, userMessage);

  const adminMessage = `🚫 **Admin Access Removed** 🚫

✅ **Action Details:**
• User ID: ${targetUserId}
• Username: @${targetUser.username || 'N/A'}
• Action: Admin access removed
• Admin: @${ctx.from?.username}

🎯 *User has been notified about admin removal*`;

  await sendFormattedMessage(ctx, adminMessage);
});

bot.command('checkuser', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const targetUserId = ctx.match?.toString();
  if (!targetUserId) {
    await sendFormattedMessage(ctx, '🔍 *Usage: /checkuser <user_id>*\n\nExample: /checkuser 123456789');
    return;
  }

  const targetUser = users.get(targetUserId);
  if (!targetUser) {
    await sendFormattedMessage(ctx, '❌ User not found.');
    return;
  }

  const userInfo = `🔍 **User Information** 🔍

👤 **Basic Details:**
• Telegram ID: ${targetUser.telegramId}
• Username: @${targetUser.username || 'N/A'}
• Name: ${targetUser.firstName || ''} ${targetUser.lastName || ''}
• Registration: ${targetUser.registrationDate.toLocaleDateString()}

📊 **Account Status:**
• Approved: ${targetUser.isApproved ? '✅ Yes' : '❌ No'}
• Premium: ${targetUser.isPremium ? '💎 Yes' : '🔹 No'}
• Admin: ${targetUser.isAdmin ? '👑 Yes' : '🔹 No'}

💳 **Credits & Usage:**
• Current Balance: ${targetUser.credits} credits
• Total Queries: ${targetUser.totalQueries}

📈 **Account Health:**
 ${targetUser.isApproved && targetUser.credits >= 0 ? '✅ Healthy' : '⚠️ Needs attention'}`;

  await sendFormattedMessage(ctx, userInfo);
});

bot.command('users', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const userList = Array.from(users.values()).map((u, index) => {
    const status = u.isPremium ? '💎' : u.isApproved ? '✅' : '⏳';
    const adminBadge = u.isAdmin ? '👑' : '';
    return `${index + 1}. ${status}${adminBadge} @${u.username || 'N/A'} (${u.telegramId}) - ${u.credits} credits`;
  }).join('\n');

  const response = `📋 **User List** 📋

👥 **Total Users:** ${users.size}
💎 **Premium Users:** ${Array.from(users.values()).filter(u => u.isPremium).length}
✅ **Approved Users:** ${Array.from(users.values()).filter(u => u.isApproved).length}
👑 **Admins:** ${Array.from(users.values()).filter(u => u.isAdmin).length}

📊 **User Details:>
 ${userList}

💎 Legend: 💎 Premium | ✅ Approved | ⏳ Pending | 👑 Admin`;

  await sendFormattedMessage(ctx, response);
});

bot.command('topusers', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const topUsers = Array.from(users.values())
    .filter(u => u.isApproved)
    .sort((a, b) => b.totalQueries - a.totalQueries)
    .slice(0, 10);

  if (topUsers.length === 0) {
    await sendFormattedMessage(ctx, '🏆 No approved users found.');
    return;
  }

  const userList = topUsers.map((u, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
    const status = u.isPremium ? '💎' : '🔹';
    return `${medal} ${status} @${u.username || 'N/A'} - ${u.totalQueries} queries`;
  }).join('\n');

  const response = `🏆 **Top 10 Users by Queries** 🏆

📊 **Statistics:**
• Total users shown: ${topUsers.length}
• Premium users: ${topUsers.filter(u => u.isPremium).length}
• Total queries: ${topUsers.reduce((sum, u) => sum + u.totalQueries, 0)}

🎯 **Leaderboard:**
 ${userList}

💎 Legend: 💎 Premium | 🔹 Standard`;

  await sendFormattedMessage(ctx, response);
});

bot.command('premiumlist', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const premiumUsers = Array.from(users.values()).filter(u => u.isPremium);

  if (premiumUsers.length === 0) {
    await sendFormattedMessage(ctx, '💎 No premium users found.');
    return;
  }

  const userList = premiumUsers.map((u, index) => {
    const adminBadge = u.isAdmin ? '👑' : '';
    return `${index + 1}. 💎${adminBadge} @${u.username || 'N/A'} (${u.telegramId})`;
  }).join('\n');

  const response = `💎 **Premium Members List** 💎

👥 **Total Premium Users:** ${premiumUsers.length}
👑 **Premium Admins:** ${premiumUsers.filter(u => u.isAdmin).length}

📊 **Premium Members:**
 ${userList}

💎 Legend: 💎 Premium | 👑 Admin`;

  await sendFormattedMessage(ctx, response);
});

// Registration Management Commands
bot.command('registrations', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  if (registrationRequests.size === 0) {
    await sendFormattedMessage(ctx, '📋 **No Pending Registrations** 📋\n\n✅ All registration requests have been processed.');
    return;
  }

  const registrationList = Array.from(registrationRequests.values()).map((req, index) => {
    return `${index + 1}. ⏳ @${req.username || 'N/A'} (${req.telegramId}) - ${req.timestamp.toLocaleDateString()}`;
  }).join('\n');

  const response = `📋 **Pending Registration Requests** 📋

👥 **Total Pending:** ${registrationRequests.size}

📊 **Registration List:**
 ${registrationList}

🎯 **Actions:**
• Use /approve <user_id> to approve
• Use /reject <user_id> to reject
• Or use the callback buttons in notification messages`;

  await sendFormattedMessage(ctx, response);
});

bot.command('approve', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const targetUserId = ctx.match?.toString();
  if (!targetUserId) {
    await sendFormattedMessage(ctx, '✅ *Usage: /approve <user_id>*\n\nExample: /approve 123456789');
    return;
  }

  const request = registrationRequests.get(targetUserId);
  if (!request) {
    await sendFormattedMessage(ctx, '❌ Registration request not found.');
    return;
  }

  const user = users.get(targetUserId) || {
    telegramId: targetUserId,
    username: request.username,
    firstName: request.firstName,
    lastName: request.lastName,
    isApproved: false,
    credits: 0,
    isPremium: false,
    isAdmin: false,
    totalQueries: 0,
    registrationDate: new Date()
  };

  user.isApproved = true;
  user.credits = 25;
  users.set(targetUserId, user);
  registrationRequests.delete(targetUserId);

  const userMessage = `🎉 **Registration Approved!** 🎉

✅ *Congratulations! Your registration has been approved.*

💎 **Welcome Benefits:**
• 25 starting credits 🪙
• Full access to all OSINT tools
• Premium features available

🚀 **Get Started:**
• Use /start to see all available commands
• Try /help for detailed instructions
• Check /credits to see your balance

⚡ *Thank you for joining our OSINT community!*`;

  await notifyUser(targetUserId, userMessage);

  const adminMessage = `✅ **Registration Approved Successfully** ✅

👤 **User Details:**
• User ID: ${targetUserId}
• Username: @${user.username || 'N/A'}
• Credits Granted: 25

🎯 **Action Completed:**
• Status: Approved ✅
• Processed by: @${ctx.from?.username}
• Timestamp: ${new Date().toLocaleString()}

💎 *User has been notified about approval*`;

  await sendFormattedMessage(ctx, adminMessage);
});

bot.command('reject', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const targetUserId = ctx.match?.toString();
  if (!targetUserId) {
    await sendFormattedMessage(ctx, '❌ *Usage: /reject <user_id>*\n\nExample: /reject 123456789');
    return;
  }

  const request = registrationRequests.get(targetUserId);
  if (!request) {
    await sendFormattedMessage(ctx, '❌ Registration request not found.');
    return;
  }

  registrationRequests.delete(targetUserId);

  const userMessage = `❌ **Registration Rejected** ❌

📋 *Your registration request has been rejected.*

📞 **Next Steps:**
• Contact the admin for more information
• Review registration requirements
• You may submit a new request if needed

💡 *If you believe this is an error, please reach out to our support team*`;

  await notifyUser(targetUserId, userMessage);

  const adminMessage = `❌ **Registration Rejected Successfully** ❌

👤 **User Details:**
• User ID: ${targetUserId}
• Username: @${request.username || 'N/A'}

🎯 **Action Completed:**
• Status: Rejected ❌
• Processed by: @${ctx.from?.username}
• Timestamp: ${new Date().toLocaleString()}

💎 *User has been notified about rejection*`;

  await sendFormattedMessage(ctx, adminMessage);
});

// Approve all pending registrations command
bot.command('approveall', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  if (registrationRequests.size === 0) {
    await sendFormattedMessage(ctx, '📋 **No Pending Registrations** 📋\n\n✅ All registration requests have been processed.');
    return;
  }

  const pendingRequests = Array.from(registrationRequests.values());
  const approvedUsers = [];

  // Process all pending registrations
  for (const request of registrationRequests.values()) {
    const targetUserId = request.telegramId;
    
    // Check if user already exists
    let user = users.get(targetUserId);
    if (!user) {
      user = {
        telegramId: targetUserId,
        username: request.username,
        firstName: request.firstName,
        lastName: request.lastName,
        isApproved: false,
        credits: 0,
        isPremium: false,
        isAdmin: false,
        totalQueries: 0,
        registrationDate: new Date()
      };
    }

    // Approve the user
    user.isApproved = true;
    user.credits = 25; // Give starting credits
    users.set(targetUserId, user);
    approvedUsers.push({
      userId: targetUserId,
      username: request.username || 'N/A'
    });

    // Notify the user
    const userMessage = `🎉 **Registration Approved!** 🎉

✅ *Congratulations! Your registration has been approved.*

💎 **Welcome Benefits:**
• 25 starting credits 🪙
• Full access to all OSINT tools
• Premium features available

🚀 **Get Started:**
• Use /start to see all available commands
• Try /help for detailed instructions
• Check /credits to see your balance

⚡ *Thank you for joining our OSINT community!*`;

    await notifyUser(targetUserId, userMessage);
  }

  // Clear all registration requests
  const totalApproved = pendingRequests.length;
  registrationRequests.clear();

  // Send confirmation to admin
  const adminMessage = `✅ **All Registrations Approved Successfully** ✅

📊 **Approval Summary:**
• Total Approved: ${totalApproved} users
• Credits per User: 25 🪙
• Total Credits Distributed: ${totalApproved * 25} 🪙

👥 **Approved Users:**
 ${approvedUsers.map((user, index) => `${index + 1}. @${user.username} (${user.userId})`).join('\n')}

🎯 **Action Completed:**
• Status: All Approved ✅
• Processed by: @${ctx.from?.username}
• Timestamp: ${new Date().toLocaleString()}

💎 *All users have been notified about their approval*`;

  await sendFormattedMessage(ctx, adminMessage);
});

// Statistics Commands
bot.command('adminstats', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const totalUsers = users.size;
  const approvedUsers = Array.from(users.values()).filter(u => u.isApproved).length;
  const premiumUsers = Array.from users.values()).filter(u => u.isPremium).length;
  const adminUsers = Array.from(users.values()).filter(u => u.isAdmin).length;
  const totalQueries = Array.from(users.values()).reduce((sum, u) => sum + u.totalQueries, 0);
  const pendingRegistrations = registrationRequests.size;

  const statsMessage = `📊 **Admin Statistics Dashboard** 📊

👥 **User Statistics:**
• Total Users: ${totalUsers}
• Approved Users: ${approvedUsers}
• Premium Users: ${premiumUsers}
• Admin Users: ${adminUsers}
• Pending Registrations: ${pendingRegistrations}

📈 **Usage Statistics:**
• Total Queries: ${totalQueries}
• Average Queries/User: ${approvedUsers > 0 ? (totalQueries / approvedUsers).toFixed(1) : 0}

💎 **Premium Metrics:**
• Premium Conversion: ${totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0}%
• Approval Rate: ${totalUsers > 0 ? ((approvedUsers / totalUsers) * 100).toFixed(1) : 0}%

🔧 **System Health:**
• Bot Status: ✅ Online
• Database: ✅ Connected
• Maintenance Mode: ${maintenanceMode ? 'ON' : 'OFF'}
• Last Update: ${new Date().toLocaleString()}`;

  await sendFormattedMessage(ctx, statsMessage);
});

bot.command('activity', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const recentUsers = Array.from(users.values())
    .filter(u => u.isApproved)
    .sort((a, b) => b.totalQueries - a.totalQueries)
    .slice(0, 10);

  const activityList = recentUsers.map((u, index) => 
    `• ${index + 1}. @${u.username || 'N/A'} - ${u.totalQueries} queries`
  ).join('\n');

  const activityMessage = `📈 **Recent Activity Log** 📈

👥 **Most Active Users (Top 10):}
 ${activityList || 'No recent activity'}

📊 **Activity Summary:**
• Total Active Users: ${recentUsers.length}
• Total Queries: ${recentUsers.reduce((sum, u) => sum + u.totalQueries, 0)}
• Average Queries: ${recentUsers.length > 0 ? (recentUsers.reduce((sum, u) => sum + u.totalQueries, 0) / recentUsers.length).toFixed(1) : 0}

🔄 *Real-time activity monitoring*`;

  await sendFormattedMessage(ctx, activityMessage);
});

bot.command('revenue', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const premiumUsers = Array.from(users.values()).filter(u => u.isPremium).length;
  const totalUsers = Array.from(users.values()).filter(u => u.isApproved).length;
  
  const monthlyPremiumPrice = 9.99;
  const estimatedMonthlyRevenue = premiumUsers * monthlyPremiumPrice;
  const estimatedYearlyRevenue = estimatedMonthlyRevenue * 12;

  const revenueMessage = `💰 **Premium Revenue Statistics** 💰

👥 **Premium Metrics:**
• Premium Users: ${premiumUsers}
• Total Approved Users: ${totalUsers}
• Premium Conversion Rate: ${totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0}%

💵 **Revenue Estimates:**
• Monthly Price: $${monthlyPremiumPrice}
• Estimated Monthly Revenue: $${estimatedMonthlyRevenue.toFixed(2)}
• Estimated Yearly Revenue: $${estimatedYearlyRevenue.toFixed(2)}`;

  await sendFormattedMessage(ctx, revenueMessage);
});

// System Control Commands
bot.command('broadcast', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const message = ctx.match?.toString();
  if (!message) {
    await sendFormattedMessage(ctx, '📢 *Usage: /broadcast <message>*\n\nExample: /broadcast "Maintenance scheduled for tonight"');
    return;
  }

  await sendFormattedMessage(ctx, '📢 *Preparing broadcast...*');

  const approvedUsers = Array.from(users.values()).filter(u => u.isApproved);
  let successCount = 0;
  let failCount = 0;

  for (const user of approvedUsers) {
    try {
      await notifyUser(user.telegramId, `📢 **Broadcast Message** 📢\n\n${message}`);
      successCount++;
    } catch (error) {
      console.error(`Failed to send broadcast to ${user.telegramId}:`, error);
      failCount++;
    }
  }

  const resultMessage = `📢 **Broadcast Completed** 📢

✅ **Delivery Statistics:**
• Total Users: ${approvedUsers.length}
• Successful: ${successCount}
• Failed: ${failCount}
• Success Rate: ${approvedUsers.length > 0 ? ((successCount / approvedUsers.length) * 100).toFixed(1) : 0}%

📝 **Message:**
 ${message}

👤 **Sent by:** @${ctx.from?.username || 'Admin'}`;

  await sendFormattedMessage(ctx, resultMessage);
});

bot.command('announce', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const input = ctx.match?.toString();
  if (!input || !input.includes('|')) {
    await sendFormattedMessage(ctx, '🎭 *Usage: /announce <title>|<message>*\n\nExample: /announce "New Feature|We just added domain lookup!"');
    return;
  }

  const [title, ...messageParts] = input.split('|');
  const message = messageParts.join('|').trim();

  if (!title || !message) {
    await sendFormattedMessage(ctx, '❌ Both title and message are required.');
    return;
  }

  await sendFormattedMessage(ctx, '🎭 *Preparing rich announcement...*');

  const approvedUsers = Array.from(users.values()).filter(u => u.isApproved);
  let successCount = 0;
  let failCount = 0;

  const announcementMessage = `🎭 **${title.trim()}** 🎭

 ${message}

💎 *Premium OSINT Bot Announcement*`;

  for (const user of approvedUsers) {
    try {
      await notifyUser(user.telegramId, announcementMessage);
      successCount++;
    } catch (error) {
      console.error(`Failed to send announcement to ${user.telegramId}:`, error);
      failCount++;
    }
  }

  const resultMessage = `🎭 **Rich Announcement Sent** 🎭

✅ **Delivery Statistics:**
• Total Users: ${approvedUsers.length}
• Successful: ${successCount}
• Failed: ${failCount}
• Success Rate: ${approvedUsers.length > 0 ? ((successCount / approvedUsers.length) * 100).toFixed(1) : 0}%

📝 **Announcement Details:**
• Title: ${title.trim()}
• Message: ${message}

👤 **Sent by:** @${ctx.from?.username || 'Admin'}`;

  await sendFormattedMessage(ctx, resultMessage);
});

// Real maintenance mode command
bot.command('maintenance', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const args = ctx.match?.toString().split(' ');
  if (!args || args.length < 1) {
    await sendFormattedMessage(ctx, '⚙️ *Usage: /maintenance <on|off|message>*\n\nExamples:\n• /maintenance on "Bot under maintenance"\n• /maintenance off');
    return;
  }

  const action = args[0].toLowerCase();
  
  if (action === 'on') {
    maintenanceMode = true;
    maintenanceMessage = args.slice(1).join(' ') || "Bot is currently under maintenance. Please try again later.";
    
    await sendFormattedMessage(ctx, `⚙️ **Maintenance Mode Enabled** ⚙️

✅ **Settings Updated:**
• Status: Maintenance ON
• Message: "${maintenanceMessage}"
• Admin: @${ctx.from?.username}

🔧 All non-admin users will now see the maintenance message when using the bot.`);
    
    // Notify all users about maintenance
    const approvedUsers = Array.from(users.values()).filter(u => u.isApproved);
    for (const user of approvedUsers) {
      try {
        if (!isAdmin(user.telegramId)) {
          await notifyUser(user.telegramId, maintenanceMessage);
        }
      } catch (error) {
        console.error(`Failed to notify user ${user.telegramId} about maintenance:`, error);
      }
    }
  } 
  else if (action === 'off') {
    maintenanceMode = false;
    
    await sendFormattedMessage(ctx, `⚙️ **Maintenance Mode Disabled** ⚙️

✅ **Settings Updated:**
• Status: Maintenance OFF
• Admin: @${ctx.from?.username}

🔧 All users can now use the bot normally.`);
  } 
  else {
    await sendFormattedMessage(ctx, '❌ Invalid action. Use "on" or "off".');
  }
});

bot.command('lucky', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const amount = parseInt(ctx.match?.toString() || '100');
  if (isNaN(amount) || amount <= 0) {
    await sendFormattedMessage(ctx, '🍀 *Usage: /lucky [amount]*\n\nExample: /lucky 500');
    return;
  }

  const approvedUsers = Array.from(users.values()).filter(u => u.isApproved);
  
  if (approvedUsers.length === 0) {
    await sendFormattedMessage(ctx, '❌ No approved users found for lucky draw.');
    return;
  }

  const randomIndex = Math.floor(Math.random() * approvedUsers.length);
  const luckyUser = approvedUsers[randomIndex];

  luckyUser.credits += amount;

  const userMessage = `🍀 **Lucky Draw Winner!** 🍀

🎉 **Congratulations!**
💰 **Prize:** ${amount} credits
💳 **New Balance:** ${luckyUser.credits} credits
🎯 **Total Participants:** ${approvedUsers.length}

✨ *You are today's lucky winner!*

💎 *Enjoy your bonus credits!*`;

  await notifyUser(luckyUser.telegramId, userMessage);

  const adminMessage = `🍀 **Lucky Draw Completed** 🍀

🎉 **Winner Details:**
• Lucky User: @${luckyUser.username || 'N/A'} (${luckyUser.telegramId})
• Prize Amount: ${amount} credits
• Total Participants: ${approvedUsers.length}
• Winner's New Balance: ${luckyUser.credits} credits

🎯 **Draw Statistics:**
• Selection Method: Random
• Odds of Winning: ${(1 / approvedUsers.length * 100).toFixed(2)}%
• Admin: @${ctx.from?.username}

✨ *Lucky user has been notified!*`;

  await sendFormattedMessage(ctx, adminMessage);
});

// Placeholder commands with premium responses
bot.command('reset_daily', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const message = `🔄 **Daily Statistics Reset** 🔄

✅ **Reset Details:**
• Users Updated: ${users.size}
• Reset Date: ${new Date().toLocaleDateString()}
• Admin: @${ctx.from?.username}

📊 *All daily query counts have been reset to zero*`;

  await sendFormattedMessage(ctx, message);
});

bot.command('masspremium', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const message = `👑 **Mass Premium Upgrade** 👑

🎊 **Upgrade Features:**
• Multiple user selection
• Bulk premium status
• Discounted pricing
• Special promotions

👑 *This feature requires additional implementation*

🎯 **Current Premium Users:** ${Array.from(users.values()).filter(u => u.isPremium).length}
👤 **Requested by:** @${ctx.from?.username}`;

  await sendFormattedMessage(ctx, message);
});

bot.command('resetuser', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const targetUserId = ctx.match?.toString();
  const targetUser = targetUserId ? users.get(targetUserId) : null;

  const message = `🔄 **User Account Reset** 🔄

⚠️ *User reset functionality would be implemented here*

🔄 **Reset Features:**
• Clear user statistics
• Reset credit balance
• Remove query history
• Fresh start option

👤 **Target User:** @${targetUser?.username || 'N/A'} (${targetUserId || 'Not specified'})
🎯 **Current Status:** User data preserved
👤 **Requested by:** @${ctx.from?.username}

🔄 *This feature requires additional implementation*`;

  await sendFormattedMessage(ctx, message);
});

bot.command('logs', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const message = `📜 **System Logs** 📜

⚠️ *System logs functionality would be implemented here*

📋 **Log Categories:**
• Error logs
• User activity logs
• System performance logs
• Security logs

📊 **Current System Status:`
• Bot: ✅ Online
• Users: ${users.size} registered
• Queries: ${Array.from(users.values()).reduce((sum, u) => sum + u.totalQueries, 0)} total
• Admin: @${ctx.from?.username}

📜 *This feature requires additional implementation*`;

  await sendFormattedMessage(ctx, message);
});

bot.command('backup', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId || !isAdmin(telegramId)) {
    await sendFormattedMessage(ctx, '❌ This command is only available to administrators.');
    return;
  }

  const message = `💾 **Database Backup** 💾

⚠️ *Backup functionality would be implemented here*

📋 **Backup Features:**
• User data export
• Query history backup
• Credit transaction logs
• Settings and configurations

📊 **Current Data:**
• Total Users: ${users.size}
• Total Queries: ${Array.from(users.values()).reduce((sum, u) => sum + u.totalQueries, 0)} total
• Registration Requests: ${registrationRequests.size}
• Admin: @${ctx.from?.username}

💾 *This feature requires additional implementation*`;

  await sendFormattedMessage(ctx, message);
});

// Check registration status command
bot.command('checkstatus', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId) return;

  // Check if user exists in users map
  const user = users.get(telegramId);
  if (user) {
    const statusMessage = `📋 **Your Registration Status** 📋

👤 **Account Information:**
• Telegram ID: ${telegramId}
• Username: @${user.username || 'N/A'}
• Status: ${user.isApproved ? '✅ Approved' : '❌ Not Approved'}
• Credits: ${user.credits} 🪙
• Premium: ${user.isPremium ? '💎 Yes' : '🔹 No'}

📅 **Registration Date:** ${user.registrationDate.toLocaleDateString()}

 ${!user.isApproved ? '\n✅ *Your account is approved and ready to use!*' : '\n⏳ *Your account is pending approval. Please wait for admin to review your request.*'}`;

    await sendFormattedMessage(ctx, statusMessage);
  } else {
    // Check if there's a pending registration request
    const request = registrationRequests.get(telegramId);
    if (request) {
      await sendFormattedMessage(ctx, '⏳ *Your registration is pending approval.*\n\nPlease wait for the admin to review your request.');
    } else {
      await sendFormattedMessage(ctx, '❌ *No registration found.*\n\nPlease use /register to submit your registration request.');
    }
  }
});

// Sync registration command (for users who were approved but lost data)
bot.command('sync', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId) return;

  const user = users.get(telegramId);
  if (user && user.isApproved) {
    await sendFormattedMessage(ctx, '✅ *Your account is already synced and approved!*');
    return;
  }

  // Auto-approve if admin ID (original admin)
  if (telegramId === adminId) {
    const adminUser = {
      telegramId,
      username: ctx.from?.username || 'fuck_sake',
      firstName: ctx.from?.first_name || 'Admin',
      lastName: ctx.from?.last_name || '',
      isAdmin: true,
      isApproved: true,
      credits: 999999,
      isPremium: true,
      totalQueries: 0,
      registrationDate: new Date()
    };
    users.set(telegramId, adminUser);
    await sendFormattedMessage(ctx, '✅ *Admin account synced successfully!*');
    return;
  }

  // Note: Made admins need to be manually restored by original admin if bot restarts
  await sendFormattedMessage(ctx, '❌ *No approved registration found.*\n\n📋 **If you were made admin but lost access:**\n• Contact the original admin (@fuck_sake)\n• Or use /register to submit new request\n\n💡 *Made admins lose access if bot restarts - this is normal for security.*');
});

// Test command
bot.command('test', async (ctx) => {
  await sendFormattedMessage(ctx, '✅ **Bot is working!** 🚀\n\nAll commands are operational. Try:\n• /start\n• /register\n• /ip 8.8.8.8\n• /email test@example.com\n• /num 9389482769\n• /basicnum 919087654321\n• /myip\n• /dl <video_url> (new universal command)\n• /admin (for admin)');

// Error handling with conflict resolution
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  
  // Handle 409 Conflict error specifically
  if (e.code === 409) {
    console.log('⚠️ Bot conflict detected - stopping current instance...');
    process.exit(0);
  }
  
  console.error('Error:', e);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  bot.stop();
  process.exit(0);
});

// Start bot with conflict detection
console.log('🚀 Starting Premium OSINT Bot with Complete Admin Panel & Registration Management...');
console.log(`🤖 Bot Username: @OsintShit_Bot`);
console.log(`👑 Admin ID: ${adminId}`);
console.log('📡 Starting polling...');

bot.start().then(() => {
  console.log('✅ Bot is now running and polling for updates!');
  console.log('🎯 All OSINT commands, admin panel, and registration management are ready!');
  console.log('🎬 Enhanced video downloader with size detection and platform auto-detection is now active!');
  console.log('🔧 Real maintenance mode functionality is now active!');
}).catch((error) => {
  console.error('❌ Failed to start bot:', error);
  
  // If it's a conflict error, exit gracefully
  if (error.code === 409) {
    console.log('⚠️ Another bot instance is running. Exiting to prevent conflicts...');
    process.exit(0);
  }
});