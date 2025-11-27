import { Resend } from 'resend';
import { logger } from './pino';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email templates for feedback requests
 */

interface FeedbackEmailData {
  to: string;
  userName: string;
  intentTitle: string;
  intentId: string;
  feedbackUrl: string;
  hasFeedbackQuestions: boolean;
}

/**
 * Send feedback request email
 */
export async function sendFeedbackRequestEmail(data: FeedbackEmailData) {
  const {
    to,
    userName,
    intentTitle,
    intentId,
    feedbackUrl,
    hasFeedbackQuestions,
  } = data;

  const _to = 'bounced@resend.dev';

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Miglee <noreply@miglee.pl>',
      to: _to,
      subject: `Jak oceniasz "${intentTitle}"?`,
      html: `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oceń wydarzenie</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; background: linear-gradient(to right, #4f46e5, #7c3aed, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                miglee.pl
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111827;">
                Cześć ${userName}! 👋
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                Dziękujemy za udział w wydarzeniu <strong>"${intentTitle}"</strong>!
              </p>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                Twoja opinia jest dla nas bardzo ważna i pomoże nam ulepszyć przyszłe wydarzenia. 
                ${hasFeedbackQuestions ? 'Poprosimy Cię o wystawienie oceny oraz odpowiedź na kilka krótkich pytań.' : 'Poprosimy Cię o wystawienie oceny wydarzenia.'}
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 32px 0;">
                    <a href="${feedbackUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(to right, #4f46e5, #7c3aed); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
                      ⭐ Oceń wydarzenie
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Lub skopiuj ten link do przeglądarki:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.6; color: #9ca3af; word-break: break-all;">
                ${feedbackUrl}
              </p>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                  Dziękujemy,<br>
                  <strong style="color: #111827;">Zespół Miglee</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6b7280; text-align: center;">
                Ten email został wysłany, ponieważ brałeś/brałaś udział w wydarzeniu na Miglee.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.5; color: #9ca3af; text-align: center;">
                © ${new Date().getFullYear()} Miglee. Wszelkie prawa zastrzeżone.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `
Cześć ${userName}!

Dziękujemy za udział w wydarzeniu "${intentTitle}"!

Twoja opinia jest dla nas bardzo ważna i pomoże nam ulepszyć przyszłe wydarzenia. 
${hasFeedbackQuestions ? 'Poprosimy Cię o wystawienie oceny oraz odpowiedź na kilka krótkich pytań.' : 'Poprosimy Cię o wystawienie oceny wydarzenia.'}

Oceń wydarzenie: ${feedbackUrl}

Dziękujemy,
Zespół Miglee

---
Ten email został wysłany, ponieważ brałeś/brałaś udział w wydarzeniu na Miglee.
© ${new Date().getFullYear()} Miglee. Wszelkie prawa zastrzeżone.
      `.trim(),
    });

    logger.info(
      { emailId: result.data?.id, to, intentId },
      'Feedback email sent successfully'
    );

    return result;
  } catch (error) {
    logger.error({ error, to, intentId }, 'Failed to send feedback email');
    throw error;
  }
}

/**
 * Generate feedback URL with JWT token (placeholder for now)
 */
export function generateFeedbackUrl(intentId: string, userId: string): string {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';

  // TODO: Generate JWT token with intentId, userId, and expiry
  // For now, just use the intentId (auth will be checked by canSubmitFeedback)
  const token = `temp_${userId}_${intentId}`;

  return `${baseUrl}/feedback/${intentId}?token=${token}`;
}
