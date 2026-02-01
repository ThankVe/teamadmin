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

const sendToTelegram = async (botToken: string, chatId: string, message: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Sanitize chat ID - remove spaces and validate format
    const cleanChatId = chatId.replace(/\s/g, '').trim();
    
    // Validate chat ID format (should be a number, optionally with - prefix for groups)
    if (!/^-?\d+$/.test(cleanChatId)) {
      console.error(`Invalid chat ID format: "${chatId}" -> "${cleanChatId}"`);
      return { success: false, error: `รูปแบบ Chat ID ไม่ถูกต้อง: ${chatId}` };
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    console.log(`Sending to Telegram chat: ${cleanChatId}`);

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: 'Markdown',
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELEGRAM_BOT_TOKEN) {
      console.log('Telegram bot token not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Telegram bot token not configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { event, test, chatId, statusUpdate } = await req.json() as RequestBody;

    // Format date in Thai
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let message: string;

    if (test) {
      message = `
🔔 *ทดสอบการแจ้งเตือน*

✅ การเชื่อมต่อสำเร็จ!
📅 เวลา: ${new Date().toLocaleString('th-TH')}
      `.trim();
    } else if (statusUpdate) {
      // Status update notification
      message = `
🔄 *อัปเดตสถานะงาน*

📌 *ชื่องาน:* ${event.title}
🎯 *กิจกรรม:* ${event.activity_name}
📅 *วันที่:* ${formattedDate}
⏰ *เวลา:* ${event.start_time} - ${event.end_time}
${event.location ? `📍 *สถานที่:* ${event.location}` : ''}

📊 *สถานะ:* ${statusUpdate.oldStatus} → *${statusUpdate.newStatus}*
      `.trim();
    } else {
      // New event notification
      message = `
🎬 *งานใหม่เข้าระบบ!*

📌 *ชื่องาน:* ${event.title}
🎯 *กิจกรรม:* ${event.activity_name}
📅 *วันที่:* ${formattedDate}
⏰ *เวลา:* ${event.start_time} - ${event.end_time}
${event.location ? `📍 *สถานที่:* ${event.location}` : ''}

_กรุณาตรวจสอบและเตรียมตัวล่วงหน้า_
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

    // Fetch all active telegram groups from database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: groups, error: groupsError } = await supabase
      .from('telegram_groups')
      .select('chat_id, name')
      .eq('is_active', true);

    if (groupsError) {
      console.error('Error fetching telegram groups:', groupsError);
    }

    // Also check legacy TELEGRAM_CHAT_ID for backward compatibility
    const legacyChatId = Deno.env.get('TELEGRAM_CHAT_ID');
    
    const chatIds: string[] = [];
    
    // Add groups from database
    if (groups && groups.length > 0) {
      chatIds.push(...groups.map(g => g.chat_id));
      console.log(`Found ${groups.length} active telegram groups`);
    }
    
    // Add legacy chat ID if exists and not already in list
    if (legacyChatId && !chatIds.includes(legacyChatId)) {
      chatIds.push(legacyChatId);
      console.log('Added legacy TELEGRAM_CHAT_ID');
    }

    if (chatIds.length === 0) {
      console.log('No telegram groups configured');
      return new Response(
        JSON.stringify({ success: false, message: 'No telegram groups configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Send to all groups
    const results = await Promise.all(
      chatIds.map(id => sendToTelegram(TELEGRAM_BOT_TOKEN, id, message))
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
