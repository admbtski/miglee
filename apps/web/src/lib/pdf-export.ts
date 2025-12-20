/**
 * PDF Export Utility for Check-in Lists
 * Generates PDF attendance lists for events
 */

import jsPDF from 'jspdf';

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

export function generateParticipantListPDF(options: ExportOptions): void {
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

  // Create new PDF (A4 size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper function for page breaks
  const checkPageBreak = (requiredSpace: number = 10) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Attendance List', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Event details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(eventName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  if (eventDate) {
    doc.text(`Date: ${eventDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }

  if (eventLocation) {
    doc.text(`Location: ${eventLocation}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }

  if (organizerName) {
    doc.text(`Organizer: ${organizerName}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }

  // Generation date
  const now = new Date();
  doc.text(
    `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  yPos += 10;

  // Summary stats
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  const totalParticipants = participants.length;
  const checkedInCount = participants.filter((p) => p.isCheckedIn).length;
  const attendanceRate =
    totalParticipants > 0
      ? Math.round((checkedInCount / totalParticipants) * 100)
      : 0;

  doc.text(
    `Total: ${totalParticipants} | Checked In: ${checkedInCount} | Rate: ${attendanceRate}%`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  yPos += 10;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Table header
  checkPageBreak(20);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  let xPos = margin + 3;
  const colWidths = {
    no: 10,
    checkbox: includeCheckboxes ? 10 : 0,
    name: includeEmail ? 50 : 70,
    email: includeEmail ? 55 : 0,
    status: includeCheckinStatus ? 35 : 0,
  };

  doc.text('#', xPos, yPos);
  xPos += colWidths.no;

  if (includeCheckboxes) {
    doc.text('☐', xPos, yPos);
    xPos += colWidths.checkbox;
  }

  doc.text('Name / Username', xPos, yPos);
  xPos += colWidths.name;

  if (includeEmail) {
    doc.text('Email', xPos, yPos);
    xPos += colWidths.email;
  }

  if (includeCheckinStatus) {
    doc.text('Status', xPos, yPos);
  }

  yPos += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  participants.forEach((participant, index) => {
    checkPageBreak(10);

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
    }

    xPos = margin + 3;

    // Number
    doc.setTextColor(100, 100, 100);
    doc.text(`${index + 1}`, xPos, yPos);
    xPos += colWidths.no;

    // Checkbox
    if (includeCheckboxes) {
      doc.setDrawColor(150, 150, 150);
      doc.rect(xPos + 1, yPos - 4, 4, 4, 'S');
      if (participant.isCheckedIn) {
        doc.setTextColor(34, 197, 94); // green
        doc.text('✓', xPos + 1.5, yPos + 0.5);
      }
      xPos += colWidths.checkbox;
    }

    // Name
    doc.setTextColor(0, 0, 0);
    const displayName = participant.name || participant.username || 'Unknown';
    const truncatedName =
      displayName.length > 30 ? displayName.slice(0, 27) + '...' : displayName;
    doc.text(truncatedName, xPos, yPos);
    xPos += colWidths.name;

    // Email
    if (includeEmail && participant.email) {
      doc.setTextColor(100, 100, 100);
      const truncatedEmail =
        participant.email.length > 35 ? participant.email.slice(0, 32) + '...' : participant.email;
      doc.text(truncatedEmail, xPos, yPos);
      xPos += colWidths.email;
    }

    // Status
    if (includeCheckinStatus) {
      if (participant.isCheckedIn) {
        doc.setTextColor(34, 197, 94); // green
        doc.setFont('helvetica', 'bold');
        doc.text('✓ Checked In', xPos, yPos);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.setTextColor(161, 161, 170); // zinc-400
        doc.text('Not checked in', xPos, yPos);
      }
    }

    yPos += 8;
  });

  // Footer on last page
  yPos = pageHeight - margin;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text('Generated by Appname Event Management', pageWidth / 2, yPos, {
    align: 'center',
  });

  // Save PDF
  const fileName = `${eventName.replace(/\s+/g, '-')}-attendance-${Date.now()}.pdf`;
  doc.save(fileName);
}

export function generateBlankAttendanceSheet(options: {
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  rows: number;
}): void {
  const { eventName, eventDate, eventLocation, rows = 30 } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Sheet', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(14);
  doc.text(eventName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  if (eventDate) {
    doc.text(`Date: ${eventDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }

  if (eventLocation) {
    doc.text(`Location: ${eventLocation}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }

  yPos += 5;

  // Table
  doc.setDrawColor(200, 200, 200);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  // Header row
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'FD');
  doc.text('#', margin + 3, yPos + 5);
  doc.text('☐', margin + 15, yPos + 5);
  doc.text('Name', margin + 25, yPos + 5);
  doc.text('Signature', pageWidth - margin - 40, yPos + 5);
  yPos += 8;

  // Rows
  doc.setFont('helvetica', 'normal');
  for (let i = 1; i <= rows; i++) {
    if (yPos + 10 > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }

    // Row line
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);

    // Number
    doc.setTextColor(100, 100, 100);
    doc.text(`${i}`, margin + 3, yPos + 5);

    // Checkbox
    doc.setDrawColor(150, 150, 150);
    doc.rect(margin + 15, yPos + 2, 4, 4, 'S');

    yPos += 10;
  }

  const fileName = `${eventName.replace(/\s+/g, '-')}-blank-sheet-${Date.now()}.pdf`;
  doc.save(fileName);
}
