// Client-side project status report (PDF). Built with jsPDF primitives —
// header band, stat boxes, progress bar, page-break-aware tables, and the
// project's full discussion history (general channel + task/milestone
// threads, fetched through the api layer under the caller's visibility) —
// so the "Download Project Summary" button on a project card produces
// something a manager can actually forward to a client.

import { conversations as conversationsApi } from '@/lib/api';
import { ChatMessage, InboxItem, Project } from '@/types';
import jsPDF from 'jspdf';

// ---------------------------------------------------------------------------
// Palette (matches the app: near-black ink, gray chrome, semantic accents)
// ---------------------------------------------------------------------------
const INK: [number, number, number] = [17, 24, 39]; // gray-900
const BODY: [number, number, number] = [55, 65, 81]; // gray-700
const MUTED: [number, number, number] = [107, 114, 128]; // gray-500
const CHROME: [number, number, number] = [229, 231, 235]; // gray-200
const PANEL: [number, number, number] = [243, 244, 246]; // gray-100
const ZEBRA: [number, number, number] = [250, 250, 250];
const GREEN: [number, number, number] = [5, 150, 105]; // emerald-600
const RED: [number, number, number] = [220, 38, 38]; // red-600
const BLUE: [number, number, number] = [37, 99, 235]; // blue-600
const AMBER: [number, number, number] = [217, 119, 6]; // amber-600

const M = 14; // page margin (mm)

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysOverdue(isoDate: string): number {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - due.getTime()) / 86400000);
}

type Col = { header: string; width: number | 'flex'; color?: (row: string[]) => [number, number, number] | null };

type ChatThread = { item: InboxItem; messages: ChatMessage[] };

function threadLabel(item: InboxItem): string {
  switch (item.type) {
    case 'PROJECT': return 'General — project channel';
    case 'MILESTONE': return `Milestone · ${item.title}`;
    default: return `Task · ${item.title}`;
  }
}

/** Every non-empty conversation attached to the project, General first. */
async function collectProjectChat(projectId: string): Promise<ChatThread[]> {
  const inbox = await conversationsApi.fetchInbox();
  const order = { PROJECT: 0, MILESTONE: 1, TASK: 2, DM: 3 } as const;
  const items = inbox
    .filter((i) => i.projectId === projectId && i.lastMessageAt)
    .sort((a, b) => order[a.type] - order[b.type] || a.title.localeCompare(b.title));
  const threads: ChatThread[] = [];
  for (const item of items) {
    const messages = await conversationsApi.fetchMessages(item.conversationId);
    if (messages.length > 0) threads.push({ item, messages });
  }
  return threads;
}

export async function downloadProjectSummary(project: Project) {
  // Fetch the discussion up front; a chat hiccup must not block the report.
  const chat = await collectProjectChat(project.id).catch((): ChatThread[] | null => null);

  const doc = new jsPDF(); // A4 portrait, mm
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - 2 * M;
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 18) {
      doc.addPage();
      y = M;
    }
  };

  // ---- header band ---------------------------------------------------------
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TAVRON PROJECT HUB', M, 9, { baseline: 'top' });
  doc.setFontSize(15);
  doc.text('Project Status Report', M, 14.5, { baseline: 'top' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Generated ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pageW - M, 15.5, { align: 'right', baseline: 'top' }
  );

  // ---- project title + status pill ------------------------------------------
  y = 34;
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(project.name, contentW - 34);
  doc.text(titleLines, M, y, { baseline: 'top' });

  const statusColor = project.status === 'ACTIVE' ? GREEN : project.status === 'ON_HOLD' ? AMBER : MUTED;
  const statusLabel = project.status === 'ON_HOLD' ? 'ON HOLD' : project.status;
  doc.setFontSize(8);
  const pillW = doc.getTextWidth(statusLabel) + 8;
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageW - M - pillW, y + 0.5, pillW, 6.5, 3.2, 3.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabel, pageW - M - pillW / 2, y + 2.2, { align: 'center', baseline: 'top' });

  y += titleLines.length * 7 + 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Started ${fmtDate(project.createdAt)}   ·   Last activity ${fmtDate(project.updatedAt)}`, M, y, { baseline: 'top' });
  y += 8;

  // ---- stat boxes -----------------------------------------------------------
  const msDone = project.milestones.filter((m) => m.status === 'COMPLETED').length;
  const msTotal = project.milestones.length;
  const overdue = project.milestones.filter((m) => m.status !== 'COMPLETED' && daysOverdue(m.dueDate) > 0).length;
  const tasksOpen = project.tasks.filter((t) => t.status !== 'DONE').length;
  const progress = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;

  const boxes: { value: string; label: string; color?: [number, number, number] }[] = [
    { value: `${progress}%`, label: 'Milestone progress' },
    { value: `${msDone} / ${msTotal}`, label: 'Milestones complete' },
    { value: `${tasksOpen} open · ${project.tasks.length - tasksOpen} done`, label: 'Tasks' },
    { value: String(overdue), label: 'Overdue milestones', color: overdue > 0 ? RED : GREEN },
  ];
  const gap = 4;
  const boxW = (contentW - gap * 3) / 4;
  boxes.forEach((b, i) => {
    const x = M + i * (boxW + gap);
    doc.setFillColor(...PANEL);
    doc.roundedRect(x, y, boxW, 17, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...(b.color ?? INK));
    doc.text(b.value, x + 4, y + 3.5, { baseline: 'top' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(b.label.toUpperCase(), x + 4, y + 11, { baseline: 'top' });
  });
  y += 21;

  // ---- progress bar ----------------------------------------------------------
  doc.setFillColor(...CHROME);
  doc.roundedRect(M, y, contentW, 2.6, 1.3, 1.3, 'F');
  if (progress > 0) {
    doc.setFillColor(...(overdue > 0 ? AMBER : GREEN));
    doc.roundedRect(M, y, Math.max(4, contentW * (progress / 100)), 2.6, 1.3, 1.3, 'F');
  }
  y += 9;

  // ---- shared drawing helpers -------------------------------------------------
  const sectionTitle = (title: string) => {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...INK);
    doc.text(title, M, y, { baseline: 'top' });
    y += 6;
    doc.setDrawColor(...CHROME);
    doc.setLineWidth(0.3);
    doc.line(M, y, M + contentW, y);
    y += 3;
  };

  const drawTable = (cols: Col[], rows: string[][]) => {
    const flexW = contentW - cols.reduce((s, c) => s + (c.width === 'flex' ? 0 : c.width), 0);
    const widths = cols.map((c) => (c.width === 'flex' ? flexW : c.width));

    const header = () => {
      doc.setFillColor(...PANEL);
      doc.rect(M, y, contentW, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...BODY);
      let x = M;
      cols.forEach((c, i) => {
        doc.text(c.header.toUpperCase(), x + 2, y + 2, { baseline: 'top' });
        x += widths[i];
      });
      y += 6.5;
    };

    ensureSpace(20);
    header();
    doc.setFontSize(8.5);

    rows.forEach((row, rIdx) => {
      // Wrap every cell, row height = tallest cell.
      const wrapped = row.map((cell, i) => doc.splitTextToSize(cell, widths[i] - 4));
      const rowH = Math.max(...wrapped.map((w) => w.length)) * 3.6 + 3;
      if (y + rowH > pageH - 18) {
        doc.addPage();
        y = M;
        header();
        doc.setFontSize(8.5);
      }
      if (rIdx % 2 === 1) {
        doc.setFillColor(...ZEBRA);
        doc.rect(M, y, contentW, rowH, 'F');
      }
      let x = M;
      cols.forEach((c, i) => {
        const color = c.color?.(row);
        doc.setTextColor(...(color ?? BODY));
        doc.setFont('helvetica', color ? 'bold' : 'normal');
        doc.text(wrapped[i], x + 2, y + 1.8, { baseline: 'top' });
        x += widths[i];
      });
      doc.setDrawColor(...CHROME);
      doc.setLineWidth(0.15);
      doc.line(M, y + rowH, M + contentW, y + rowH);
      y += rowH;
    });
    y += 7;
  };

  // ---- milestones -------------------------------------------------------------
  sectionTitle(`Milestones (${msTotal})`);
  if (msTotal === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('No milestones defined.', M, y, { baseline: 'top' });
    y += 8;
  } else {
    const msRows = [...project.milestones]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((m, i) => {
        const od = m.status !== 'COMPLETED' ? daysOverdue(m.dueDate) : 0;
        const status =
          m.status === 'COMPLETED' ? 'Completed'
          : od > 0 ? `Overdue ${od}d`
          : m.status === 'IN_PROGRESS' ? 'In progress'
          : 'Pending';
        return [String(i + 1), m.title, fmtDate(m.dueDate), status];
      });
    drawTable(
      [
        { header: '#', width: 9 },
        { header: 'Milestone', width: 'flex' },
        { header: 'Due', width: 27 },
        {
          header: 'Status', width: 27,
          color: (row) =>
            row[3] === 'Completed' ? GREEN
            : row[3].startsWith('Overdue') ? RED
            : row[3] === 'In progress' ? BLUE
            : null,
        },
      ],
      msRows
    );
  }

  // ---- tasks --------------------------------------------------------------------
  sectionTitle(`Tasks (${project.tasks.length})`);
  if (project.tasks.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('No tasks defined.', M, y, { baseline: 'top' });
    y += 8;
  } else {
    const taskRows = project.tasks.map((t) => {
      const eng = project.engineers.find((e) => e.id === t.engineerId);
      const status = t.status === 'DONE' ? 'Done' : t.status === 'IN_PROGRESS' ? 'In progress' : 'To do';
      return [t.title, eng?.name ?? 'Unassigned', status];
    });
    drawTable(
      [
        { header: 'Task', width: 'flex' },
        { header: 'Assignee', width: 45 },
        {
          header: 'Status', width: 25,
          color: (row) => (row[2] === 'Done' ? GREEN : row[2] === 'In progress' ? BLUE : null),
        },
      ],
      taskRows
    );
  }

  // ---- team ----------------------------------------------------------------------
  sectionTitle(`Team (${project.engineers.length})`);
  if (project.engineers.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('No engineers assigned.', M, y, { baseline: 'top' });
    y += 8;
  } else {
    drawTable(
      [
        { header: 'Name', width: 48 },
        { header: 'Discipline', width: 'flex' },
        { header: 'Email', width: 62 },
      ],
      project.engineers.map((e) => [e.name, e.role, e.email])
    );
  }

  // ---- documents -------------------------------------------------------------------
  sectionTitle(`Documents (${project.docs.length})`);
  if (project.docs.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('No documents attached.', M, y, { baseline: 'top' });
    y += 8;
  } else {
    drawTable(
      [
        { header: 'Title', width: 'flex' },
        { header: 'Type', width: 22 },
        { header: 'Added', width: 27 },
      ],
      project.docs.map((d) => [d.title, d.type === 'LINK' ? 'Link' : 'File', fmtDate(d.dateAdded)])
    );
  }

  // ---- discussion history ------------------------------------------------------
  const totalMessages = (chat ?? []).reduce((s, t) => s + t.messages.length, 0);
  sectionTitle(`Project Discussion (${totalMessages} message${totalMessages === 1 ? '' : 's'})`);
  if (chat === null) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('Messages could not be loaded for this report.', M, y, { baseline: 'top' });
    y += 8;
  } else if (chat.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('No messages yet.', M, y, { baseline: 'top' });
    y += 8;
  } else {
    const fmtTime = (iso: string) =>
      new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    for (const thread of chat) {
      ensureSpace(18);
      doc.setFillColor(...PANEL);
      doc.rect(M, y, contentW, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...INK);
      doc.text(threadLabel(thread.item), M + 2, y + 2, { baseline: 'top' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED);
      doc.text(`${thread.messages.length} message${thread.messages.length === 1 ? '' : 's'}`, M + contentW - 2, y + 2, {
        align: 'right', baseline: 'top',
      });
      y += 9;

      for (const msg of thread.messages) {
        const bodyLines: string[] = doc.splitTextToSize(msg.content, contentW - 8);
        const quoteLines: string[] = msg.quote
          ? doc.splitTextToSize(`↪ ${msg.quote.authorName}: ${msg.quote.content}`, contentW - 12)
          : [];
        const extra = (msg.imageUrl ? 3.8 : 0) + quoteLines.length * 3.4;
        ensureSpace(4.5 + bodyLines.length * 3.6 + extra + 2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...INK);
        doc.text(msg.authorName, M + 4, y, { baseline: 'top' });
        const nameW = doc.getTextWidth(msg.authorName);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MUTED);
        doc.text(`  ·  ${fmtTime(msg.createdAt)}`, M + 4 + nameW, y, { baseline: 'top' });
        y += 4.2;

        if (quoteLines.length > 0) {
          doc.setFontSize(7.5);
          doc.setTextColor(...MUTED);
          doc.text(quoteLines, M + 8, y, { baseline: 'top' });
          y += quoteLines.length * 3.4;
        }

        doc.setFontSize(8.5);
        doc.setTextColor(...BODY);
        doc.text(bodyLines, M + 4, y, { baseline: 'top' });
        y += bodyLines.length * 3.6;

        if (msg.imageUrl) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(...MUTED);
          doc.text('[photo attached]', M + 4, y, { baseline: 'top' });
          doc.setFont('helvetica', 'normal');
          y += 3.8;
        }
        y += 2;
      }
      y += 5;
    }
  }

  // ---- footer on every page -----------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...CHROME);
    doc.setLineWidth(0.3);
    doc.line(M, pageH - 12, pageW - M, pageH - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Tavron Project Hub  ·  ${project.name}`, M, pageH - 9, { baseline: 'top' });
    doc.text(`Page ${p} of ${pages}`, pageW - M, pageH - 9, { align: 'right', baseline: 'top' });
  }

  doc.save(`${project.name.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()}_report.pdf`);
}
