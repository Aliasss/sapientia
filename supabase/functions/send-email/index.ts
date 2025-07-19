import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  email: string;
  type: "subscription_confirmation" | "password_reset" | "welcome";
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // CORS 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { email, type, data } = await req.json() as EmailPayload;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "이메일 주소가 필요합니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!type) {
      return new Response(
        JSON.stringify({ error: "이메일 유형이 필요합니다" }),
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
    
    // 이메일 템플릿 선택
    let subject = "";
    let html = "";
    
    switch (type) {
      case "subscription_confirmation":
        subject = "SAPIENTIA 뉴스레터 구독을 확인해주세요";
        html = getSubscriptionConfirmationTemplate(email);
        break;
      case "password_reset":
        subject = "SAPIENTIA 비밀번호 재설정";
        html = getPasswordResetTemplate(email, data?.resetUrl as string);
        break;
      case "welcome":
        subject = "SAPIENTIA에 오신 것을 환영합니다";
        html = getWelcomeTemplate(email, data?.name as string);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "유효하지 않은 이메일 유형입니다" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
    // Resend API를 사용하여 이메일 발송
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "SAPIENTIA <noreply@sapientia.com>",
        to: email,
        subject,
        html
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(result));
    }
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// 구독 확인 이메일 템플릿
function getSubscriptionConfirmationTemplate(email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SAPIENTIA 뉴스레터 구독 확인</title>
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
        </div>
        <div class="content">
          <p>안녕하세요,</p>
          <p><strong>${email}</strong> 주소로 SAPIENTIA 뉴스레터 구독 신청이 접수되었습니다.</p>
          <p>구독을 확인하려면 아래 버튼을 클릭해주세요:</p>
          <div style="text-align: center;">
            <a href="https://sapientia.com/confirm-subscription?email=${encodeURIComponent(email)}" class="button">구독 확인</a>
          </div>
          <p>만약 이 이메일이 잘못 전송되었다면, 무시하셔도 됩니다.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 SAPIENTIA. All rights reserved.</p>
          <p class="unsubscribe">구독을 취소하려면 <a href="https://sapientia.com/unsubscribe?email=${encodeURIComponent(email)}">여기</a>를 클릭하세요.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 비밀번호 재설정 이메일 템플릿
function getPasswordResetTemplate(email: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SAPIENTIA 비밀번호 재설정</title>
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
        .warning {
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
        </div>
        <div class="content">
          <p>안녕하세요,</p>
          <p>SAPIENTIA 계정의 비밀번호 재설정을 요청하셨습니다.</p>
          <p>아래 버튼을 클릭하여 새 비밀번호를 설정하세요:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">비밀번호 재설정</a>
          </div>
          <p>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.</p>
          <p class="warning">이 링크는 24시간 동안만 유효합니다.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 SAPIENTIA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 환영 이메일 템플릿
function getWelcomeTemplate(email: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SAPIENTIA에 오신 것을 환영합니다</title>
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SAPIENTIA</h1>
        </div>
        <div class="content">
          <p>안녕하세요 ${name || ''}님,</p>
          <p>SAPIENTIA에 가입해주셔서 감사합니다!</p>
          <p>SAPIENTIA는 철학적 사고와 지혜를 탐구하는 플랫폼입니다. 이제 다음과 같은 기능을 이용하실 수 있습니다:</p>
          <ul>
            <li>개인 생각 저널 기록하기</li>
            <li>철학적 질문에 대한 깊은 탐구</li>
            <li>세 가지 이해의 기둥을 통한 통찰력 얻기</li>
          </ul>
          <p>지금 바로 시작해보세요:</p>
          <div style="text-align: center;">
            <a href="https://sapientia.com/journal" class="button">저널 시작하기</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 SAPIENTIA. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 