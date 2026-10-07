import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSubmissionNotification({
  businessEmail,
  formTitle,
  submissionId,
  dashboardUrl,
}: {
  businessEmail: string;
  formTitle: string;
  submissionId: string;
  dashboardUrl: string;
}) {
  await resend.emails.send({
    from: 'FormAI <notifications@formai.app>',
    to: businessEmail,
    subject: `הגשה חדשה: ${formTitle}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>התקבלה הגשה חדשה לטופס: "${formTitle}"</h2>
        <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
        <a href="${dashboardUrl}/forms/submissions/${submissionId}"
           style="background: #6366f1; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; display: inline-block;">
          צפייה בהגשה
        </a>
      </div>
    `,
  });
}
