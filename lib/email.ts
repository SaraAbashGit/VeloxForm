import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Until a domain is verified in Resend, only its test sender works (and only to the account owner's email)
const FROM = process.env.RESEND_FROM || 'FormAI <onboarding@resend.dev>';

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

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
  const title = escapeHtml(formTitle);
  await resend.emails.send({
    from: FROM,
    to: businessEmail,
    subject: `הגשה חדשה: ${formTitle}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>התקבלה הגשה חדשה לטופס: "${title}"</h2>
        <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
        <a href="${dashboardUrl}/forms/${formId}/submissions/${submissionId}"
           style="background: #64ccd0; color: #191918; font-weight: 600; padding: 12px 24px;
                  border-radius: 9999px; text-decoration: none; display: inline-block;">
          צפייה בהגשה
        </a>
      </div>
    `,
  });
}
