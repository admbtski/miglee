/**
 * PNG Export Utility for Check-in Lists
 * Generates PNG images of attendance lists for events
 */

import html2canvas from 'html2canvas';

interface ParticipantData {
  id: string;
  name: string;
  username?: string;
  email?: string;
  isCheckedIn: boolean;
  checkinMethods: string[];
  lastCheckinAt?: string;
}

interface ExportOptions {
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  organizerName?: string;
  participants: ParticipantData[];
  includeEmail?: boolean;
  includeCheckboxes?: boolean;
  includeCheckinStatus?: boolean;
}

export async function generateParticipantListPNG(
  options: ExportOptions
): Promise<void> {
  const {
    eventName,
    eventDate,
    eventLocation,
    organizerName,
    participants,
    includeEmail = false,
    includeCheckboxes = true,
    includeCheckinStatus = true,
  } = options;

  const totalParticipants = participants.length;
  const checkedInCount = participants.filter((p) => p.isCheckedIn).length;
  const attendanceRate =
    totalParticipants > 0
      ? Math.round((checkedInCount / totalParticipants) * 100)
      : 0;

  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.width = '1200px';
  container.style.padding = '40px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Build HTML content
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 10px 0; color: #18181b;">
        Event Attendance List
      </h1>
      <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 10px 0; color: #3f3f46;">
        ${eventName}
      </h2>
      ${
        eventDate
          ? `<p style="margin: 5px 0; color: #71717a;">Date: ${eventDate}</p>`
          : ''
      }
      ${
        eventLocation
          ? `<p style="margin: 5px 0; color: #71717a;">Location: ${eventLocation}</p>`
          : ''
      }
      ${
        organizerName
          ? `<p style="margin: 5px 0; color: #71717a;">Organizer: ${organizerName}</p>`
          : ''
      }
      <p style="margin: 10px 0 0 0; color: #a1a1aa; font-size: 14px;">
        Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 30px; padding: 15px; background: #f4f4f5; border-radius: 8px;">
      <p style="font-size: 18px; font-weight: 600; margin: 0; color: #18181b;">
        Total: ${totalParticipants} | Checked In: ${checkedInCount} | Rate: ${attendanceRate}%
      </p>
    </div>

    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f4f4f5; border-bottom: 2px solid #e4e4e7;">
          <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #3f3f46;">#</th>
          ${
            includeCheckboxes
              ? '<th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600; color: #3f3f46;">☐</th>'
              : ''
          }
          <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #3f3f46;">Name / Username</th>
          ${
            includeEmail
              ? '<th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #3f3f46;">Email</th>'
              : ''
          }
          ${
            includeCheckinStatus
              ? '<th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #3f3f46;">Status</th>'
              : ''
          }
        </tr>
      </thead>
      <tbody>
        ${participants
          .map(
            (participant, index) => `
          <tr style="border-bottom: 1px solid #e4e4e7; ${
            index % 2 === 0 ? 'background: #fafafa;' : ''
          }">
            <td style="padding: 10px; color: #71717a; font-size: 14px;">${index + 1}</td>
            ${
              includeCheckboxes
                ? `<td style="padding: 10px; text-align: center; font-size: 16px;">
                ${
                  participant.isCheckedIn
                    ? '<span style="color: #22c55e; font-weight: bold;">✓</span>'
                    : '☐'
                }
              </td>`
                : ''
            }
            <td style="padding: 10px; font-size: 14px; color: #18181b;">
              ${participant.name || participant.username || 'Unknown'}
            </td>
            ${
              includeEmail
                ? `<td style="padding: 10px; font-size: 14px; color: #71717a;">${participant.email || '-'}</td>`
                : ''
            }
            ${
              includeCheckinStatus
                ? `<td style="padding: 10px; font-size: 14px;">
                ${
                  participant.isCheckedIn
                    ? '<span style="color: #22c55e; font-weight: 600;">✓ Checked In</span>'
                    : '<span style="color: #a1a1aa;">Not checked in</span>'
                }
              </td>`
                : ''
            }
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
      <p style="font-size: 12px; color: #a1a1aa; font-style: italic; margin: 0;">
        Generated by Miglee Event Management
      </p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Convert to PNG and download
    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${eventName.replace(/\s+/g, '-')}-attendance-${Date.now()}.png`;
      link.href = url;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
    }, 'image/png');
  } finally {
    // Remove temporary container
    document.body.removeChild(container);
  }
}

export async function generateBlankAttendanceSheetPNG(options: {
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  rows: number;
}): Promise<void> {
  const { eventName, eventDate, eventLocation, rows = 30 } = options;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.width = '1200px';
  container.style.padding = '40px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 10px 0; color: #18181b;">
        Attendance Sheet
      </h1>
      <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 10px 0; color: #3f3f46;">
        ${eventName}
      </h2>
      ${
        eventDate
          ? `<p style="margin: 5px 0; color: #71717a;">Date: ${eventDate}</p>`
          : ''
      }
      ${
        eventLocation
          ? `<p style="margin: 5px 0; color: #71717a;">Location: ${eventLocation}</p>`
          : ''
      }
    </div>

    <table style="width: 100%; border-collapse: collapse; border: 2px solid #e4e4e7;">
      <thead>
        <tr style="background: #f4f4f5; border-bottom: 2px solid #e4e4e7;">
          <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; border-right: 1px solid #e4e4e7; width: 50px;">#</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600; border-right: 1px solid #e4e4e7; width: 50px;">☐</th>
          <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; border-right: 1px solid #e4e4e7;">Name</th>
          <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600;">Signature</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: rows })
          .map(
            (_, index) => `
          <tr style="border-bottom: 1px solid #e4e4e7;">
            <td style="padding: 15px; text-align: center; color: #71717a; border-right: 1px solid #e4e4e7;">${index + 1}</td>
            <td style="padding: 15px; text-align: center; border-right: 1px solid #e4e4e7; font-size: 16px;">☐</td>
            <td style="padding: 15px; border-right: 1px solid #e4e4e7;">&nbsp;</td>
            <td style="padding: 15px;">&nbsp;</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 30px;">
      <p style="font-size: 12px; color: #a1a1aa; font-style: italic; margin: 0;">
        Generated by Miglee Event Management
      </p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${eventName.replace(/\s+/g, '-')}-blank-sheet-${Date.now()}.png`;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
    }, 'image/png');
  } finally {
    document.body.removeChild(container);
  }
}
