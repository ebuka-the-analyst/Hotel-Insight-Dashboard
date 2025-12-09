import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken! } }
  ).then(res => res.json()).then(data => data.items?.[0]);

  return { 
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email 
  };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}

export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    // Use Resend's test sender if the configured domain isn't verified
    // In production, you should verify your own domain at https://resend.com/domains
    const senderEmail = fromEmail.includes('@hyatt.com') ? 'onboarding@resend.dev' : fromEmail;
    
    console.log(`[Email] Sending OTP to ${email} from ${senderEmail}`);
    
    const response = await client.emails.send({
      from: senderEmail,
      to: email,
      subject: 'Your AutoInsight Login Code',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">AutoInsight</h1>
            <p style="color: #666; font-size: 14px; margin-top: 8px;">Hotel Analytics Dashboard</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #ffa536 0%, #ff8c00 100%); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 16px 0;">Your verification code is:</p>
            <div style="background: rgba(255,255,255,0.95); border-radius: 8px; padding: 16px 24px; display: inline-block;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
            This code expires in 10 minutes. If you didn't request this code, you can safely ignore this email.
          </p>
          
          <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 24px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Powered by Hyatt Place Analytics
            </p>
          </div>
        </div>
      `,
    });
    
    console.log('[Email] Resend response:', JSON.stringify(response));
    
    if (response.error) {
      console.error('[Email] Resend error:', response.error);
      return { success: false, error: response.error.message };
    }
    
    console.log(`[Email] Successfully sent to ${email}, id: ${response.data?.id}`);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Failed to send OTP email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}
