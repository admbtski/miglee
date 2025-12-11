import { Resend } from 'resend';
import { logger } from './pino';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email templates for feedback requests
 */

interface FeedbackEmailData {
  to: string;
  userName: string;
  eventTitle: string;
  eventId: string;
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
    eventTitle,
    eventId,
    feedbackUrl,
    hasFeedbackQuestions,
  } = data;

  const _from = 'Test <onboarding@resend.dev>';
  const _to = 'adam.bartski@gmail.com';

  try {
    const result = await resend.emails.send({
      from: _from || process.env.EMAIL_FROM || 'Miglee <adaskoo05@gmail.com>',
      to: _to || to,
      subject: `Jak oceniasz "${eventTitle}"?`,
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
                Dziękujemy za udział w wydarzeniu <strong>"${eventTitle}"</strong>!
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

Dziękujemy za udział w wydarzeniu "${eventTitle}"!

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
      { emailId: result.data?.id, to, eventId },
      'Feedback email sent successfully'
    );

    return result;
  } catch (error) {
    logger.error({ error, to, eventId }, 'Failed to send feedback email');
    throw error;
  }
}

/**
 * Generate feedback URL with JWT token (placeholder for now)
 */
export function generateFeedbackUrl(eventId: string, userId: string): string {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';

  // TODO: Generate JWT token with eventId, userId, and expiry
  // For now, just use the eventId (auth will be checked by canSubmitFeedback)
  const token = `temp_${userId}_${eventId}`;

  return `${baseUrl}/feedback/${eventId}?token=${token}`;
}

/**
 * Account restoration email data
 */
interface AccountRestorationEmailData {
  to: string;
  userName: string;
  restorationUrl: string;
  expiresInHours: number;
}

/**
 * Send account restoration email
 */
export async function sendAccountRestorationEmail(
  data: AccountRestorationEmailData
) {
  const { to, userName, restorationUrl, expiresInHours } = data;

  const _from = 'Test <onboarding@resend.dev>';
  const _to = 'adam.bartski@gmail.com';

  try {
    const result = await resend.emails.send({
      from: _from || process.env.EMAIL_FROM || 'Miglee <adaskoo05@gmail.com>',
      to: _to || to,
      subject: 'Przywróć swoje konto Miglee',
      html: `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Przywróć konto</title>
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
                Otrzymaliśmy prośbę o przywrócenie Twojego konta Miglee.
              </p>
               
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151;">
                Jeśli chcesz przywrócić swoje konto, kliknij poniższy przycisk. Link wygaśnie za <strong>${expiresInHours} godzin</strong>.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 32px 0;">
                    <a href="${restorationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(to right, #4f46e5, #7c3aed); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
                      🔄 Przywróć konto
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Lub skopiuj ten link do przeglądarki:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.6; color: #9ca3af; word-break: break-all;">
                ${restorationUrl}
              </p>

              <div style="margin-top: 32px; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e;">
                  <strong>⚠️ Ważne:</strong> Jeśli nie prosiłeś/aś o przywrócenie konta, zignoruj tego maila. Twoje konto pozostanie usunięte.
                </p>
              </div>

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
                Ten email został wysłany na Twoje żądanie przywrócenia konta.
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

Otrzymaliśmy prośbę o przywrócenie Twojego konta Miglee.

Jeśli chcesz przywrócić swoje konto, kliknij poniższy link. Link wygaśnie za ${expiresInHours} godzin.

Przywróć konto: ${restorationUrl}

⚠️ WAŻNE: Jeśli nie prosiłeś/aś o przywrócenie konta, zignoruj tego maila. Twoje konto pozostanie usunięte.

Dziękujemy,
Zespół Miglee

---
Ten email został wysłany na Twoje żądanie przywrócenia konta.
© ${new Date().getFullYear()} Miglee. Wszelkie prawa zastrzeżone.
      `.trim(),
    });

    logger.info(
      { emailId: result.data?.id, to },
      'Account restoration email sent successfully'
    );

    return result;
  } catch (error) {
    logger.error({ error, to }, 'Failed to send restoration email');
    throw error;
  }
}

/**
 * Generate account restoration URL
 */
export function generateRestorationUrl(email: string, token: string): string {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/restore-account?email=${encodeURIComponent(email)}&token=${token}`;
}
