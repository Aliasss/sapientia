import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterPayload {
  subject: string;
  content: string;
  recipients?: string[];
}

serve(async (req) => {
  // CORS 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase 환경 변수가 설정되지 않았습니다" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 요청 데이터 파싱
    const { subject, content, recipients } = await req.json() as NewsletterPayload;
    
    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: "제목과 내용이 필요합니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "인증되지 않은 요청입니다" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "관리자 권한이 필요합니다" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 이메일 수신자 목록 가져오기
    let emailRecipients = recipients;
    if (!emailRecipients || emailRecipients.length === 0) {
      const { data: subscribers, error } = await supabase
        .from("newsletter_subscriptions")
        .select("email")
        .eq("is_active", true);
      
      if (error) {
        throw new Error(`구독자 목록 가져오기 실패: ${error.message}`);
      }
      
      emailRecipients = subscribers.map(sub => sub.email);
    }
    
    if (emailRecipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "활성 구독자가 없습니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Resend API 키
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Resend API 키가 설정되지 않았습니다" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 뉴스레터 HTML 생성
    const html = getNewsletterTemplate(subject, content);
    
    // 배치 처리 (한 번에 최대 50명에게 발송)
    const batchSize = 50;
    const results = [];
    
    for (let i = 0; i < emailRecipients.length; i += batchSize) {
      const batch = emailRecipients.slice(i, i + batchSize);
      
      try {
        // Resend API를 사용하여 이메일 발송
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "SAPIENTIA <newsletter@sapientia.com>",
            bcc: batch, // BCC로 발송하여 수신자 목록 숨김
            subject,
            html
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(JSON.stringify(result));
        }
        
        results.push(result);
      } catch (error) {
        console.error(`배치 ${i / batchSize + 1} 발송 실패:`, error);
      }
      
      // API 속도 제한 방지를 위한 지연
      if (i + batchSize < emailRecipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `${emailRecipients.length}명에게 뉴스레터가 발송되었습니다`,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// 뉴스레터 템플릿
function getNewsletterTemplate(subject: string, content: string): string {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eee;
        }
        .header h1 {
          color: #1a1a2e;
          margin: 0;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #1a1a2e;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #888;
        }
        .unsubscribe {
          color: #888;
          font-size: 12px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SAPIENTIA</h1>
          <p>${subject}</p>
        </div>
        <div class="content">
          ${content}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://sapientia.com" class="button">사이트 방문하기</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${currentYear} SAPIENTIA. All rights reserved.</p>
          <p class="unsubscribe">뉴스레터 구독을 취소하려면 <a href="https://sapientia.com/unsubscribe">여기</a>를 클릭하세요.</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 