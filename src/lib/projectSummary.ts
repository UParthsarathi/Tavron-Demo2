import { Project } from '@/types';
import jsPDF from 'jspdf';

export function downloadProjectSummary(project: Project) {
  const doc = new jsPDF();
  let yPos = 20;
  const lineHeight = 7;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - 2 * margin;

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(`Project Summary`, margin, yPos);
  yPos += lineHeight * 1.5;

  doc.setFontSize(16);
  doc.text(project.name, margin, yPos);
  yPos += lineHeight * 1.5;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Status: ${project.status}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Last Updated: ${new Date(project.updatedAt).toLocaleDateString()}`, margin, yPos);
  yPos += lineHeight * 2;

  // Team
  checkPageBreak(lineHeight * 3);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Team (${project.engineers.length})`, margin, yPos);
  yPos += lineHeight * 1.2;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  project.engineers.forEach(eng => {
    checkPageBreak(lineHeight);
    doc.text(`- ${eng.name} (${eng.role}) - ${eng.email}`, margin + 5, yPos);
    yPos += lineHeight;
  });
  yPos += lineHeight;

  // Milestones
  checkPageBreak(lineHeight * 3);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Milestones (${project.milestones.length})`, margin, yPos);
  yPos += lineHeight * 1.2;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  if (project.milestones.length === 0) {
    doc.text("No milestones defined.", margin + 5, yPos);
    yPos += lineHeight;
  } else {
    project.milestones.forEach(m => {
      checkPageBreak(lineHeight);
      const statusIcon = m.status === 'COMPLETED' ? '[X]' : '[ ]';
      doc.text(`${statusIcon} ${m.title} (Due: ${new Date(m.dueDate).toLocaleDateString()})`, margin + 5, yPos);
      yPos += lineHeight;
    });
  }
  yPos += lineHeight;

  // Tasks
  checkPageBreak(lineHeight * 3);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Tasks (${project.tasks.length})`, margin, yPos);
  yPos += lineHeight * 1.2;

  if (project.tasks.length === 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("No tasks defined.", margin + 5, yPos);
    yPos += lineHeight;
  } else {
    project.tasks.forEach(t => {
      checkPageBreak(lineHeight * 4);
      const assigned = project.engineers.find(e => e.id === t.engineerId);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`[${t.status}] ${t.title}`, margin + 5, yPos);
      yPos += lineHeight;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Assigned to: ${assigned ? assigned.name : 'Unknown'}`, margin + 10, yPos);
      yPos += lineHeight;
      doc.text(`Created: ${new Date(t.createdAt).toLocaleDateString()}`, margin + 10, yPos);
      yPos += lineHeight;
      // Task discussions moved to the conversations model; the PDF sticks to
      // the work-item facts and leaves chat history to the Messages view.
      yPos += lineHeight;
    });
  }

  // Documents
  checkPageBreak(lineHeight * 3);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Documents (${project.docs.length})`, margin, yPos);
  yPos += lineHeight * 1.2;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  if (project.docs.length === 0) {
    doc.text("No documents attached.", margin + 5, yPos);
    yPos += lineHeight;
  } else {
    project.docs.forEach(d => {
      checkPageBreak(lineHeight);
      doc.text(`- ${d.title} (${d.type}) - Added: ${new Date(d.dateAdded).toLocaleDateString()}`, margin + 5, yPos);
      yPos += lineHeight;
    });
  }
  
  yPos += lineHeight;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, yPos);

  doc.save(`${project.name.replace(/\s+/g, '_').toLowerCase()}_summary.pdf`);
}
