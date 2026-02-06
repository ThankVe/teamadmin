import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Event {
  id: string;
  title: string;
  activity_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  cover_image_url: string | null;
}

interface TelegramGroup {
  chat_id: string;
  name: string;
}

const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  message: string,
  photoUrl?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanChatId = chatId.replace(/\s/g, '').trim();
    
    if (!/^-?\d+$/.test(cleanChatId)) {
      return { success: false, error: `Invalid chat ID: ${chatId}` };
    }

    if (photoUrl) {
      // Try sending with photo first
      const photoResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          photo: photoUrl,
          caption: message,
          parse_mode: 'Markdown',
        }),
      });

      const photoResult = await photoResponse.json();
      if (photoResult.ok) {
        return { success: true };
      }
      // Fall through to text message if photo fails
    }

    // Send as text message
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
      return { success: false, error: result.description };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  if (hour < 12) {
    return `${hour === 0 ? 12 : hour}:${minutes} น.`;
  } else if (hour === 12) {
    return `12:${minutes} น.`;
  } else {
    return `${hour}:${minutes} น.`;
  }
};

const handler = async (req: Request): Promise<Response> => {
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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, message: 'Supabase not configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's date in Thailand timezone (UTC+7)
    const now = new Date();
    const thailandOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const thailandTime = new Date(now.getTime() + thailandOffset);
    const today = thailandTime.toISOString().split('T')[0];

    console.log(`Checking events for date: ${today}`);

    // Fetch today's events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, activity_name, date, start_time, end_time, location, cover_image_url')
      .eq('date', today)
      .order('start_time', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return new Response(
        JSON.stringify({ success: false, error: eventsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!events || events.length === 0) {
      console.log('No events scheduled for today');
      return new Response(
        JSON.stringify({ success: true, message: 'No events scheduled for today', eventsCount: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Found ${events.length} events for today`);

    // Fetch photographers for each event
    const eventsWithPhotographers = await Promise.all(
      events.map(async (event) => {
        const { data: photographersData } = await supabase
          .from('event_photographers')
          .select('team_members(id, name)')
          .eq('event_id', event.id);

        const photographers = (photographersData || [])
          .map((p: any) => p.team_members?.name)
          .filter(Boolean);

        return { ...event, photographers };
      })
    );

    // Format Thai date
    const eventDate = new Date(today + 'T00:00:00');
    const formattedDate = eventDate.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Build message
    let message = `📅 *งานวันนี้ - ${formattedDate}*\n\n`;
    message += `📋 *มีงานทั้งหมด ${events.length} งาน*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    eventsWithPhotographers.forEach((event, index) => {
      message += `*${index + 1}. ${event.title}*\n`;
      message += `🎯 กิจกรรม: ${event.activity_name}\n`;
      message += `⏰ เวลา: ${formatTime(event.start_time)} - ${formatTime(event.end_time)}\n`;
      if (event.location) {
        message += `📍 สถานที่: ${event.location}\n`;
      }
      if (event.photographers && event.photographers.length > 0) {
        message += `👥 ผู้รับผิดชอบ: ${event.photographers.join(', ')}\n`;
      }
      message += `\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `_กรุณาเตรียมตัวและมาถึงก่อนเวลา_`;

    // Get first event's cover image for the message
    const firstEventWithImage = eventsWithPhotographers.find(e => e.cover_image_url);

    // Fetch active telegram groups
    const { data: groups, error: groupsError } = await supabase
      .from('telegram_groups')
      .select('chat_id, name')
      .eq('is_active', true);

    if (groupsError) {
      console.error('Error fetching telegram groups:', groupsError);
    }

    // Also check legacy TELEGRAM_CHAT_ID
    const legacyChatId = Deno.env.get('TELEGRAM_CHAT_ID');
    
    const chatIdSet = new Set<string>();
    
    if (groups && groups.length > 0) {
      groups.forEach(g => {
        const cleanId = g.chat_id.replace(/\s/g, '').trim();
        if (cleanId) chatIdSet.add(cleanId);
      });
    }
    
    if (legacyChatId) {
      const cleanLegacyId = legacyChatId.replace(/\s/g, '').trim();
      if (cleanLegacyId) chatIdSet.add(cleanLegacyId);
    }

    const chatIds = Array.from(chatIdSet);

    if (chatIds.length === 0) {
      console.log('No telegram groups configured');
      return new Response(
        JSON.stringify({ success: false, message: 'No telegram groups configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Send to all groups
    const results = await Promise.all(
      chatIds.map(id => sendTelegramMessage(
        TELEGRAM_BOT_TOKEN,
        id,
        message,
        firstEventWithImage?.cover_image_url || undefined
      ))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`Daily reminder sent: ${successCount}/${chatIds.length} groups`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        eventsCount: events.length,
        sent: successCount,
        total: chatIds.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in daily-event-reminder:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
