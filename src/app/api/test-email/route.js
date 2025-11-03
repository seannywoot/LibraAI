import { sendMail } from "@/lib/email";

export async function GET() {
  try {
    console.log('[TEST] Environment variables check:');
    console.log('[TEST] EMAILJS_SERVICE_ID:', !!process.env.EMAILJS_SERVICE_ID);
    console.log('[TEST] EMAILJS_TEMPLATE_ID:', !!process.env.EMAILJS_TEMPLATE_ID);
    console.log('[TEST] EMAILJS_PRIVATE_KEY:', !!process.env.EMAILJS_PRIVATE_KEY);
    console.log('[TEST] EMAILJS_PUBLIC_KEY:', !!process.env.EMAILJS_PUBLIC_KEY);
    console.log('[TEST] EMAIL_FROM:', process.env.EMAIL_FROM);

    const result = await sendMail({
      to: "libraaismartlibraryassistant@gmail.com", // Your actual email
      subject: "Test Email from Production",
      text: "This is a test email to verify EmailJS configuration.",
      html: "<p>This is a test email to verify EmailJS configuration.</p>",
    });

    return Response.json({ 
      success: true, 
      result,
      env_check: {
        service_id: !!process.env.EMAILJS_SERVICE_ID,
        template_id: !!process.env.EMAILJS_TEMPLATE_ID,
        private_key: !!process.env.EMAILJS_PRIVATE_KEY,
        public_key: !!process.env.EMAILJS_PUBLIC_KEY,
      }
    });
  } catch (error) {
    console.error('[TEST] Email send failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
