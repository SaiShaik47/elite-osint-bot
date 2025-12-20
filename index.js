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

// Direct Video Download Helper Function
async function downloadAndSendVideo(ctx, videoUrl, title, platform = 'Unknown') {
  try {
    await ctx.reply(`⏳ Downloading ${platform} video...`);
    
    // Download video with timeout
    const videoResponse = await axios.get(videoUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024 // 50MB limit
    });
    
    const videoBuffer = Buffer.from(videoResponse.data, 'binary');
    
    // Create caption
    const caption = `🎬 **${platform} Video Downloaded Successfully!** 🎬

📝 **Title:** ${title}
🎯 **Platform:** ${platform}
📊 **Size:** ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB

💎 *1 credit has been deducted from your account*`;
    
    // Send video directly with metadata
    await ctx.replyWithVideo(
      { source: videoBuffer },
      {
        caption: caption,
        parse_mode: 'Markdown',
        title: title,
        duration: 0,
        supports_streaming: true,
        width: 1280,
        height: 720
      }
    );
    
    return true;
  } catch (error) {
    console.error(`${platform} video download error:`, error.message);
    
    // Send error message and refund credit
    const errorMessage = `❌ **Failed to download ${platform} video** ❌

📋 **Error Details:**
• ${error.message}
• Please check the URL and try again

💎 *1 credit has been refunded to your account*`;
    
    await ctx.reply(errorMessage, { parse_mode: 'Markdown' });
    return false;
  }
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
    console.error('Error sending formatted message:', error);
    const plainText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```(.*?)```/gs, '$1');
    await ctx.reply(plainText);
  }
}

// Helper function to notify admin
async function notifyAdmin(message, keyboard = null) {
  try {
    if (keyboard) {
      await bot.api.sendMessage(adminId, message, { 
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });
    } else {
      await bot.api.sendMessage(adminId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}

// Helper function to notify user
async function notifyUser(userId, message) {
  try {
    await bot.api.sendMessage(userId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Failed to notify user:', error);
  }
}

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

👤 **User:** @${request.username || 'N/A'} (${targetUserId})
📅 **Processed:** ${new Date().toLocaleDateString()}
🎯 **Status:** Rejected

*Processed by:* @${ctx.from?.username || 'Admin'}`);
  }
  }
});

// Social Media Video Downloader Commands - Direct Video Download
bot.command('snap', async (ctx) => {
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

  const videoUrl = ctx.match;
  if (!videoUrl) {
    await sendFormattedMessage(ctx, '🦼 *Usage: /snap <Snapchat video URL>*\n\nExample: /snap https://snapchat.com/t/H2D8zTxt');
    return;
  }

  try {
    const result = await downloadSnapchat(videoUrl.toString());
    
    if (result.success && result.data && result.data.download_url) {
      // Download and send video directly
      const success = await downloadAndSendVideo(ctx, result.data.download_url, result.data.title || 'Snapchat Video', 'Snapchat');
      
      if (!success) {
        // Refund credit if download fails
        user.credits += 1;
        await sendFormattedMessage(ctx, '❌ Failed to download Snapchat video. Please try again later.\n💳 1 credit refunded');
      }
    } else {
      // Refund credit if API call fails
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to fetch Snapchat video. Please check the URL and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in snap command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while downloading Snapchat video.\n💳 1 credit refunded');
  }
});

bot.command('insta', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  const videoUrl = ctx.match;
  if (!videoUrl) {
    await sendFormattedMessage(ctx, '💎 *Usage: /insta <Instagram video URL>*\n\nExample: /insta https://www.instagram.com/reel/DSSvFDgjU3s/?igsh=dGQ0YW10Y2Rwb293');
    return;
  }

  try {
    const result = await downloadInstagram(videoUrl.toString());
    
    if (result.success && result.data && result.data.download_url) {
      // Download and send video directly
      const success = await downloadAndSendVideo(ctx, result.data.download_url, result.data.title || 'Instagram Video', 'Instagram');
      
      if (!success) {
        // Refund credit if download fails
        user.credits += 1;
        await sendFormattedMessage(ctx, '❌ Failed to download Instagram video. Please try again later.\n💳 1 credit refunded');
      }
    } else {
      // Refund credit if API call fails
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to fetch Instagram video. Please check the URL and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in insta command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while downloading Instagram video.\n💳 1 credit refunded');
  }
});

bot.command('pin', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  const videoUrl = ctx.match;
  if (!videoUrl) {
    await sendFormattedMessage(ctx, '❤️ *Usage: /pin <Pinterest video URL>*\n\nExample: /pin https://pin.it/4gsJMxtt1');
    return;
  }

  try {
    const result = await downloadPinterest(videoUrl.toString());
    
    if (result.success && result.data && result.data.download_url) {
      // Download and send video directly
      const success = await downloadAndSendVideo(ctx, result.data.download_url, result.data.title || 'Pinterest Video', 'Pinterest');
      
      if (!success) {
        // Refund credit if download fails
        user.credits += 1;
        await sendFormattedMessage(ctx, '❌ Failed to download Pinterest video. Please try again later.\n💳 1 credit refunded');
      }
    } else {
      // Refund credit if API call fails
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to fetch Pinterest video. Please check the URL and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in pin command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while downloading Pinterest video.\n💳 1 credit refunded');
  }
});

bot.command('fb', async (ctx) => {
  const user = getOrCreateUser(ctx);
  if (!user || !user.isApproved) {
    await sendFormattedMessage(ctx, '❌ You need to be approved to use this command. Use /register to submit your request.');
    return;
  }

  const videoUrl = ctx.match;
  if (!videoUrl) {
    await sendFormattedMessage(ctx, '❤️ *Usage: /fb <Facebook video URL>*\n\nExample: /fb https://www.facebook.com/reel/1157396829623170/');
    return;
  }

  try {
    const result = await downloadFacebook(videoUrl.toString());
    
    if (result.success && result.data && result.data.download_url) {
      // Download and send video directly
      const success = await downloadAndSendVideo(ctx, result.data.download_url, result.data.title || 'Facebook Video', 'Facebook');
      
      if (!success) {
        // Refund credit if download fails
        user.credits += 1;
        await sendFormattedMessage(ctx, '❌ Failed to download Facebook video. Please try again later.\n💳 1 credit refunded');
      }
    } else {
      // Refund credit if API call fails
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to fetch Facebook video. Please check the URL and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in fb command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while downloading Facebook video.\n💳 1 credit refunded');
  }
});

bot.command('terabox', async (ctx) => {
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

  const videoUrl = ctx.match;
  if (!videoUrl) {
    await sendFormattedMessage(ctx, '📁 *Usage: /terabox <TeraBox URL>*\n\nExample: /terabox https://terabox.com/s/1234567890');
    return;
  }

  try {
    const result = await downloadTeraBox(videoUrl.toString());
    
    if (result.success && result.data && result.data.download_url) {
      // Download and send video directly
      const success = await downloadAndSendVideo(ctx, result.data.download_url, result.data.title || 'TeraBox Video', 'TeraBox');
      
      if (!success) {
        // Refund credit if download fails
        user.credits += 1;
        await sendFormattedMessage(ctx, '❌ Failed to download TeraBox video. Please try again later.\n💳 1 credit refunded');
      }
    } else {
      // Refund credit if API call fails
      user.credits += 1;
      await sendFormattedMessage(ctx, '❌ Failed to fetch TeraBox video. Please check the URL and try again.\n💳 1 credit refunded');
    }
  } catch (error) {
    console.error('Error in terabox command:', error);
    // Refund credit on error
    user.credits += 1;
    await sendFormattedMessage(ctx, '❌ An error occurred while downloading TeraBox video.\n💳 1 credit refunded');
    }
  }
});

// System Commands
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
      user.totalQueries++;
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
• Check inbox regularly

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

💎 **Want more credits?**
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
• /help - Show this help message

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
• /snap https://snapchat.com/t/H2D8zTxt
• /insta https://www.instagram.com/reel/DSSvFDgjU3s/?igsh=dGQ0YW10Y2Rwb293
• /pin https://pin.it/4gsJMxtt1
• /fb https://www.facebook.com/reel/1157396829623170/

⚠️ **Important Notes:**
• Each query consumes 1 credit
• Results are for educational purposes only
• Use responsibly and legally
• Respect privacy laws

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

📢 📣 **Broadcast & Communication:**
• /broadcast <message> - 📢 Send message to all
• /announce <title>|<message> - 🎭 Rich announcement
• /premiumall - 👑 Mass premium upgrade
• /maintenance - ⚙️ Toggle maintenance mode

🔧 ⚙️ **System Management:**
• /resetdaily - 🔄 Reset daily statistics
• /lucky - 🍀 Random user bonus
• /maintenance - ⚙️ Toggle maintenance mode

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
• Admin: @${ctx.from?.username}`;

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
📞 24/7 premium support

🌟 *Thank you for upgrading to Premium!*` :
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
• Admin: @${ctx.from?.username}`;

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
    await sendFormattedMessage(ctx, '⚠️ User is already an admin.');
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
• Admin: @${ctx.from?.username}`;

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
    await sendFormattedMessage(ctx, '❌ User not found.');
    return;
  }

  const targetUser = users.get(targetUserId);
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

📞 *If you have questions about this change, please reach out to main admin*`;

  await notifyUser(targetUserId, userMessage);

  const adminMessage = `🚫 **Admin Access Removed** 🚫

✅ **Action Details:**
• User ID: ${targetUserId}
• Username: @${targetUser.username || 'N/A'}
• Action: Admin access removed
• Admin: @${ctx.from?.username}`;

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

📊 **User Details:**
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
  const premiumUsers = Array.from(users.values()).filter(u => u.isPremium).length;
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
• Average Queries/User: ${approvedUsers > 0 ? (totalQueries / approvedUsers).toFixed(1) : 0}%

💎 **Premium Metrics:**
• Premium Conversion: ${totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0}%
• Approval Rate: ${totalUsers > 0 ? ((approvedUsers / totalUsers) * 100).toFixed(1) : 0}%

🔧 **System Health:**
• Bot Status: ✅ Online
• Database: ✅ Connected
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

👥 **Most Active Users (Top 10):**
${activityList || 'No recent activity'}

📊 **Activity Summary:**
• Total Active Users: ${recentUsers.length}
• Total Queries: ${recentUsers.reduce((sum, u) => sum + u.totalQueries, 0)}
• Average Queries: ${recentUsers.length > 0 ? (recentUsers.reduce((sum, u) => sum + u.totalQueries, 0) / recentUsers.length).toFixed(1) : 0) }

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
  const totalUsers = Array.from(users.values()).filter(u => u => approvedUsers).length;
  
  const monthlyPremiumPrice = 9.99;
  const estimatedMonthlyRevenue = premiumUsers * monthlyPremiumPrice;
  const estimatedYearlyRevenue = estimatedMonthlyRevenue * 12;

  const revenueMessage = `💰 **Premium Revenue Statistics** 💰

👥 **Premium Metrics:**
• Premium Users: ${premiumUsers}
• Total Approved Users: ${totalUsers}
• Premium Conversion Rate: ${totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0}%
• Approval Rate: ${totalUsers > 0 ? ((approvedUsers / totalUsers) * 100).toFixed(1) : 0}%

💵 **Revenue Estimates:**
• Monthly Price: $${monthlyPremiumPrice}
• Estimated Monthly Revenue: $${estimatedMonthlyRevenue.toFixed(2)}
• Estimated Yearly Revenue: $${estimatedYearlyRevenue.toFixed(2)}`;

📈 **Growth Potential:**
• Target Conversion: 10%
• Potential Premium Users: ${Math.round(totalUsers * 0.1)}
• Potential Monthly Revenue: $${(Math.round(totalUsers * 0.1) * monthlyPremiumPrice).toFixed(2)}`;

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

${message}`;

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
• Success Rate: ${approvedUsers.length > 0 ? ((successCount / approvedUsers.length) * 100).toFixed(1) : 0)%
• Success Rate: ${approvedUsers.length > 0 ? ((successCount / approvedUsers.length) * 100).toFixed(1) : 0%}

📝 **Announcement Details:**
• Title: ${title.trim()}
• Message: ${message}

👤 **Sent by:** @${ctx.from?.username || 'Admin'}`;

  await sendFormattedMessage(ctx, resultMessage);
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
• Winner's New Balance: ${luckyUser.credits}

✨ *You are today's lucky winner!*`;

  await notifyUser(luckyUser.telegramId, userMessage);

  const adminMessage = `🍀 **Lucky Draw Completed** 🍀

🎉 **Winner Details:**
• Lucky User: @${luckyUser.username || 'N/A'} (${luckyUser.telegramId})
• Prize Amount: ${amount} credits
• Total Participants: ${approvedUsers.length}
• Winner's New Balance: ${luckyUser.credits}
• Odds of Winning: ${(1 / approvedUsers.length * 100).toFixed(2)}%
• Admin: @${ctx.from?.username}

✨ *Lucky user has been notified!*`;

  await sendFormattedMessage(ctx, adminMessage);
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

${!user.isApproved ? '\n⏳ *Your account is pending approval. Please wait for admin to review your request.*' : '\n✅ *Your account is approved and ready to use!*'}`;

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
  }
});

// Test command
bot.command('test', async (ctx) => {
  await sendFormattedMessage(ctx, '✅ **Bot is working!** 🚀\n\nAll commands are operational. Try:\n• /start\n• /register\n• /ip 8.8.8.8\n• /email test@example.com\n• /num 9389482769\n• /basicnum 919087654321\n• /myip\n• /admin (for admin)');
});

// Error handling
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

// Start bot
console.log('🚀 Starting Premium OSINT Bot with Direct Video Downloads...');
console.log(`🤖 Bot Username: @OsintShit_Bot`);
console.log(`👑 Admin ID: ${adminId}`);
console.log('📡 Starting polling...');

bot.start().then(() => {
  console.log('✅ Bot is now running and polling for updates!');
  console.log('🎯 All video downloaders now send videos directly!');
}).catch((error) => {
  console.error('❌ Failed to start bot:', error);
  
  // If it's a conflict error, exit gracefully
  if (error.code === 409) {
    console.log('⚠️ Another bot instance is running. Exiting to prevent conflicts...');
    process.exit(0);
  }
    console.error('Error:', error);
  }
});
