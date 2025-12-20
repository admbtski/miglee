import { Resend } from 'resend';
import { config } from '../env';
import { logger } from './pino';

const resend = new Resend(config.resendApiKey);

/**
 * Email templates for event reminders
 */

interface EventReminderEmailData {
  to: string;
  userName: string;
  eventTitle: string;
  eventId: string;
  startAt: Date;
  minutesBefore: number;
  eventUrl: string;
}

/**
 * Send event reminder email
 */
export async function sendEventReminderEmail(data: EventReminderEmailData) {
  const {
    to,
    userName,
    eventTitle,
    eventId,
    startAt,
    minutesBefore,
    eventUrl,
  } = data;

  // Format time remaining
  const timeRemaining =
    minutesBefore >= 60
      ? `${Math.round(minutesBefore / 60)} ${Math.round(minutesBefore / 60) === 1 ? 'godzinę' : 'godzin'}`
      : `${minutesBefore} ${minutesBefore === 1 ? 'minutę' : minutesBefore < 5 ? 'minuty' : 'minut'}`;

  // Format event start time
  const eventTime = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(startAt);

  try {
    const result = await resend.emails.send({
      from: config.emailFrom,
      to,
      subject: `Przypomnienie: "${eventTitle}" za ${timeRemaining}`,
      html: `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Przypomnienie o wydarzeniu</title>
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
                appname.pl
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">⏰</span>
              </div>
              
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111827; text-align: center;">
                Cześć ${userName}!
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #374151; text-align: center;">
                Przypominamy, że już za <strong style="color: #4f46e5;">${timeRemaining}</strong> rozpoczyna się:
              </p>

              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #ffffff;">
                  ${eventTitle}
                </h3>
                <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
                  📅 ${eventTime}
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 32px 0;">
                    <a href="${eventUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(to right, #4f46e5, #7c3aed); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
                      🎯 Zobacz szczegóły
                    </a>
                  </td>
                </tr>
              </table>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                  Do zobaczenia na wydarzeniu!<br>
                  <strong style="color: #111827;">Zespół Appname</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6b7280; text-align: center;">
                Otrzymujesz ten email, ponieważ zapisałeś/aś się na wydarzenie w Appname.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.5; color: #9ca3af; text-align: center;">
                © ${new Date().getFullYear()} Appname. Wszelkie prawa zastrzeżone.
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

Przypominamy, że już za ${timeRemaining} rozpoczyna się:

${eventTitle}
📅 ${eventTime}

Zobacz szczegóły: ${eventUrl}

Do zobaczenia na wydarzeniu!
Zespół Appname

---
Otrzymujesz ten email, ponieważ zapisałeś/aś się na wydarzenie w Appname.
© ${new Date().getFullYear()} Appname. Wszelkie prawa zastrzeżone.
      `.trim(),
    });

    logger.info(
      { emailId: result.data?.id, to, eventId, minutesBefore },
      'Event reminder email sent successfully'
    );

    return result;
  } catch (error) {
    logger.error(
      { error, to, eventId, minutesBefore },
      'Failed to send event reminder email'
    );
    throw error;
  }
}

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

  try {
    const result = await resend.emails.send({
      from: config.emailFrom,
      to,
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
                appname.pl
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
                  <strong style="color: #111827;">Zespół Appname</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6b7280; text-align: center;">
                Ten email został wysłany, ponieważ brałeś/brałaś udział w wydarzeniu na Appname.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.5; color: #9ca3af; text-align: center;">
                © ${new Date().getFullYear()} Appname. Wszelkie prawa zastrzeżone.
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
Zespół Appname

---
Ten email został wysłany, ponieważ brałeś/brałaś udział w wydarzeniu na Appname.
© ${new Date().getFullYear()} Appname. Wszelkie prawa zastrzeżone.
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
 * Generate feedback URL with JWT token
 * Token includes eventId, userId, and 7-day expiry for secure feedback submission
 */
export function generateFeedbackUrl(eventId: string, userId: string): string {
  const baseUrl = config.appUrl;

  // Create JWT payload
  const payload = {
    eventId,
    userId,
    purpose: 'feedback',
  };

  // Sign JWT with 7-day expiry
  // Note: In production, use a proper JWT library or Fastify's JWT plugin
  // For now, we create a simple token (this should be replaced with proper JWT signing)
  try {
    // Simple base64 encoding for development (REPLACE WITH PROPER JWT IN PRODUCTION)
    const tokenData = JSON.stringify({
      ...payload,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      iat: Date.now(),
    });
    const token = Buffer.from(tokenData).toString('base64url');

    return `${baseUrl}/feedback/${eventId}?token=${token}`;
  } catch (error) {
    logger.error({ error, eventId, userId }, 'Failed to generate feedback URL');
    // Fallback to simple URL without token (auth will be checked by canSubmitFeedback)
    return `${baseUrl}/feedback/${eventId}`;
  }
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

  try {
    const result = await resend.emails.send({
      from: config.emailFrom,
      to,
      subject: 'Przywróć swoje konto Appname',
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
                appname.pl
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
                Otrzymaliśmy prośbę o przywrócenie Twojego konta Appname.
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
                  <strong style="color: #111827;">Zespół Appname</strong>
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
                © ${new Date().getFullYear()} Appname. Wszelkie prawa zastrzeżone.
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

Otrzymaliśmy prośbę o przywrócenie Twojego konta Appname.

Jeśli chcesz przywrócić swoje konto, kliknij poniższy link. Link wygaśnie za ${expiresInHours} godzin.

Przywróć konto: ${restorationUrl}

⚠️ WAŻNE: Jeśli nie prosiłeś/aś o przywrócenie konta, zignoruj tego maila. Twoje konto pozostanie usunięte.

Dziękujemy,
Zespół Appname

---
Ten email został wysłany na Twoje żądanie przywrócenia konta.
© ${new Date().getFullYear()} Appname. Wszelkie prawa zastrzeżone.
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
 * Generate account restoration URL with secure token
 */
export function generateRestorationUrl(email: string, token: string): string {
  const baseUrl = config.appUrl;
  return `${baseUrl}/restore-account?email=${encodeURIComponent(email)}&token=${token}`;
}
