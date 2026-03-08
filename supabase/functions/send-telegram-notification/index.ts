import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EventData {
  title: string;
  activity_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  cover_image_url?: string;
  photographers?: Array<{ id: string; name: string }>;
}

interface StatusUpdate {
  oldStatus: string;
  newStatus: string;
}

interface RequestBody {
  event: EventData;
  test?: boolean;
  chatId?: string;
  statusUpdate?: StatusUpdate;
}

const sendTextMessage = async (botToken: string, chatId: string, message: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanChatId = chatId.replace(/\s/g, '').trim();
    
    if (!/^-?\d+$/.test(cleanChatId)) {
      console.error(`Invalid chat ID format: "${chatId}" -> "${cleanChatId}"`);
      return { success: false, error: `รูปแบบ Chat ID ไม่ถูกต้อง: ${chatId}` };
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    console.log(`Sending text to Telegram chat: ${cleanChatId}`);

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      const errorMsg = result.description || 'Unknown error';
      console.error(`Telegram API error for chat ${cleanChatId}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
    
    console.log(`Message sent successfully to chat ${cleanChatId}`);
    return { success: true };
  } catch (error) {
    console.error(`Error sending to chat ${chatId}:`, error);
    return { success: false, error: String(error) };
  }
};

const sendPhotoMessage = async (botToken: string, chatId: string, photoUrl: string, caption: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanChatId = chatId.replace(/\s/g, '').trim();
    
    if (!/^-?\d+$/.test(cleanChatId)) {
      return { success: false, error: `รูปแบบ Chat ID ไม่ถูกต้อง: ${chatId}` };
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    console.log(`Sending photo to Telegram chat: ${cleanChatId}`);

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      const errorMsg = result.description || 'Unknown error';
      console.error(`Telegram photo API error for chat ${cleanChatId}:`, errorMsg);
      // Fallback to text message if photo fails
      return sendTextMessage(botToken, cleanChatId, caption);
    }
    
    console.log(`Photo sent successfully to chat ${cleanChatId}`);
    return { success: true };
  } catch (error) {
    console.error(`Error sending photo to chat ${chatId}:`, error);
    // Fallback to text message
    return sendTextMessage(botToken, chatId, caption);
  }
};

const sendToTelegram = async (botToken: string, chatId: string, message: string, photoUrl?: string): Promise<{ success: boolean; error?: string }> => {
  if (photoUrl) {
    return sendPhotoMessage(botToken, chatId, photoUrl, message);
  }
  return sendTextMessage(botToken, chatId, message);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!TELEGRAM_BOT_TOKEN) {
      console.log('Telegram bot token not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Telegram bot token not configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Authorization: verify caller is admin or editor
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const userSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check role using service role client
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: roleRow } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!roleRow || !['admin', 'editor'].includes(roleRow.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: admin or editor role required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { event, test, chatId, statusUpdate } = await req.json() as RequestBody;

    // Handle test notification early (no event needed)
    if (test && chatId) {
      const testMessage = `
🔔 <b>ทดสอบการแจ้งเตือน</b>

✅ การเชื่อมต่อสำเร็จ!
📅 เวลา: ${new Date().toLocaleString('th-TH')}
      `.trim();
      const result = await sendTextMessage(TELEGRAM_BOT_TOKEN, chatId, testMessage);
      return new Response(
        JSON.stringify({ success: result.success, error: result.error }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // For non-test requests, event is required
    if (!event) {
      return new Response(
        JSON.stringify({ success: false, error: 'Event data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Format date in Thai
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let message: string;
    let photoUrl: string | undefined = event.cover_image_url;
    
    // Format photographers list
    const photographersList = event.photographers && event.photographers.length > 0
      ? event.photographers.map(p => p.name).join(', ')
      : null;

    if (statusUpdate) {
      // Status update notification
      message = `
🔄 <b>อัปเดตสถานะงาน</b>

📌 <b>ชื่องาน:</b> ${event.title}
🎯 <b>กิจกรรม:</b> ${event.activity_name}
📅 <b>วันที่:</b> ${formattedDate}
⏰ <b>เวลา:</b> ${event.start_time} - ${event.end_time}
${event.location ? `📍 <b>สถานที่:</b> ${event.location}` : ''}
${photographersList ? `👥 <b>ผู้รับผิดชอบ:</b> ${photographersList}` : ''}

📊 <b>สถานะ:</b> ${statusUpdate.oldStatus} → <b>${statusUpdate.newStatus}</b>
      `.trim();
    } else {
      // New event notification
      message = `
🎬 <b>งานใหม่เข้าระบบ!</b>

📌 <b>ชื่องาน:</b> ${event.title}
🎯 <b>กิจกรรม:</b> ${event.activity_name}
📅 <b>วันที่:</b> ${formattedDate}
⏰ <b>เวลา:</b> ${event.start_time} - ${event.end_time}
${event.location ? `📍 <b>สถานที่:</b> ${event.location}` : ''}
${photographersList ? `👥 <b>ผู้รับผิดชอบ:</b> ${photographersList}` : ''}

<i>กรุณาตรวจสอบและเตรียมตัวล่วงหน้า</i>
      `.trim();
    }

    // If specific chatId provided (for testing), send only to that chat
    if (test && chatId) {
      const result = await sendToTelegram(TELEGRAM_BOT_TOKEN, chatId, message);
      return new Response(
        JSON.stringify({ success: result.success, error: result.error }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch all active telegram groups from database (reuse supabaseAdmin)
    
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('telegram_groups')
      .select('chat_id, name')
      .eq('is_active', true);

    if (groupsError) {
      console.error('Error fetching telegram groups:', groupsError);
    }

    // Also check legacy TELEGRAM_CHAT_ID for backward compatibility
    const legacyChatId = Deno.env.get('TELEGRAM_CHAT_ID');
    
    const chatIdSet = new Set<string>();
    
    // Add groups from database (sanitized)
    if (groups && groups.length > 0) {
      groups.forEach(g => {
        const cleanId = g.chat_id.replace(/\s/g, '').trim();
        if (cleanId) chatIdSet.add(cleanId);
      });
      console.log(`Found ${groups.length} active telegram groups from database`);
    }
    
    // Add legacy chat ID if exists (sanitized) - deduplicated via Set
    if (legacyChatId) {
      const cleanLegacyId = legacyChatId.replace(/\s/g, '').trim();
      if (cleanLegacyId && !chatIdSet.has(cleanLegacyId)) {
        chatIdSet.add(cleanLegacyId);
        console.log('Added legacy TELEGRAM_CHAT_ID');
      } else if (chatIdSet.has(cleanLegacyId)) {
        console.log('Legacy TELEGRAM_CHAT_ID already in database groups, skipping duplicate');
      }
    }

    const chatIds = Array.from(chatIdSet);

    if (chatIds.length === 0) {
      console.log('No telegram groups configured');
      return new Response(
        JSON.stringify({ success: false, message: 'No telegram groups configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Send to all groups (with photo if available)
    const results = await Promise.all(
      chatIds.map(id => sendToTelegram(TELEGRAM_BOT_TOKEN, id, message, photoUrl))
    );

    const successCount = results.filter(r => r.success).length;
    const errors = results.filter(r => !r.success).map(r => r.error);
    console.log(`Telegram notifications sent: ${successCount}/${chatIds.length}`);

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        sent: successCount,
        total: chatIds.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in send-telegram-notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
