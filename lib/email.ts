import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Until a domain is verified in Resend, only its test sender works (and only to the account owner's email)
const FROM = process.env.RESEND_FROM || 'FormAI <onboarding@resend.dev>';

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function button(href: string, label: string) {
  return `<a href="${href}"
     style="background: #64ccd0; color: #191918; font-weight: 600; padding: 12px 24px;
            border-radius: 9999px; text-decoration: none; display: inline-block;">
    ${label}
  </a>`;
}

/** Sends one RTL email. Best-effort: failures are logged, never thrown, so they can't break the caller's flow. */
async function sendEmail(to: string, subject: string, body: string) {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">${body}</div>`,
    });
    if (error) console.error(`Email "${subject}" to ${to} failed:`, error.message);
  } catch (error) {
    console.error(`Email "${subject}" to ${to} failed:`, error);
  }
}

export async function sendSubmissionNotification({
  businessEmail,
  formTitle,
  formId,
  submissionId,
  dashboardUrl,
}: {
  businessEmail: string;
  formTitle: string;
  formId: string;
  submissionId: string;
  dashboardUrl: string;
}) {
  await sendEmail(
    businessEmail,
    `הגשה חדשה: ${formTitle}`,
    `<h2>התקבלה הגשה חדשה לטופס: "${escapeHtml(formTitle)}"</h2>
     <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
     ${button(`${dashboardUrl}/forms/${formId}/submissions/${submissionId}`, 'צפייה בהגשה')}`
  );
}

/** To a business owner: a customer joined their business (signed up or signed in through its link) */
export async function sendNewClientNotification(args: {
  businessEmail: string;
  clientName: string;
  clientEmail: string;
  clientUrl: string;
}) {
  await sendEmail(
    args.businessEmail,
    `לקוח חדש הצטרף: ${args.clientName}`,
    `<h2>לקוח חדש הצטרף לעסק שלך</h2>
     <p><b>${escapeHtml(args.clientName)}</b> (${escapeHtml(args.clientEmail)})</p>
     <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
     ${button(args.clientUrl, 'לדף הלקוח')}`
  );
}

/** To the platform admin: a business registered itself and waits for approval */
export async function sendNewBusinessNotification(args: {
  adminEmail: string;
  businessName: string;
  businessEmail: string;
  approvalUrl: string;
}) {
  await sendEmail(
    args.adminEmail,
    `עסק חדש ממתין לאישור: ${args.businessName}`,
    `<h2>עסק חדש נרשם לפלטפורמה וממתין לאישור שלך</h2>
     <table style="border-collapse: collapse; margin: 16px 0;">
       <tr><td style="padding: 4px 0 4px 16px; color: #666;">שם העסק:</td><td><b>${escapeHtml(args.businessName)}</b></td></tr>
       <tr><td style="padding: 4px 0 4px 16px; color: #666;">מייל:</td><td>${escapeHtml(args.businessEmail)}</td></tr>
       <tr><td style="padding: 4px 0 4px 16px; color: #666;">תאריך הרשמה:</td><td>${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</td></tr>
     </table>
     ${button(args.approvalUrl, 'לצפייה ואישור')}
     <p style="color: #666; font-size: 13px;">הקישור אישי ומאפשר לאשר את העסק בלי להתחבר. אל תעבירי את המייל הזה לאחרים.</p>`
  );
}

/** To a business owner: the admin approved the account, or created it for them */
export async function sendBusinessWelcome(args: {
  businessEmail: string;
  businessName: string;
  loginUrl: string;
  createdByAdmin: boolean;
}) {
  await sendEmail(
    args.businessEmail,
    args.createdByAdmin ? 'נפתח עבורך חשבון ב-FormAI' : 'החשבון שלך ב-FormAI אושר',
    `<h2>${args.createdByAdmin ? 'נפתח עבורך חשבון עסקי' : 'החשבון העסקי שלך אושר!'}</h2>
     <p>העסק <b>${escapeHtml(args.businessName)}</b> יכול להתחיל ליצור טפסים ולשלוח אותם ללקוחות.</p>
     ${args.createdByAdmin ? '<p>את הסיסמה הזמנית תקבלו ממנהלת הפלטפורמה. מומלץ להחליף אותה אחרי הכניסה הראשונה.</p>' : ''}
     ${button(args.loginUrl, 'כניסה לחשבון')}`
  );
}
