import jsPDF from "jspdf";

/**
 * Generate PDF blob for a single note
 */
export async function generateNotePDF(note) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace = 10) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  const titleLines = doc.splitTextToSize(note.title || "Untitled", maxWidth);
  titleLines.forEach((line) => {
    checkPageBreak(12);
    doc.text(line, margin, yPosition);
    yPosition += 12;
  });

  yPosition += 5;

  // Date
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100);
  const dateStr = `Updated: ${new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  doc.text(dateStr, margin, yPosition);
  yPosition += 15;

  // Separator line
  doc.setDrawColor(200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Content
  doc.setFontSize(11);
  doc.setTextColor(0);
  
  // Strip HTML tags and convert to plain text
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = note.content || "";
  const plainText = tempDiv.textContent || tempDiv.innerText || "";
  
  const contentLines = doc.splitTextToSize(plainText, maxWidth);
  contentLines.forEach((line) => {
    checkPageBreak(7);
    doc.text(line, margin, yPosition);
    yPosition += 7;
  });

  // Return blob and filename
  const fileName = `${(note.title || "Untitled").replace(/[^a-z0-9]/gi, "_")}.pdf`;
  const blob = doc.output("blob");
  return { blob, fileName };
}

/**
 * Generate PDF blob for all notes
 */
export async function generateAllNotesPDF(notes) {
  if (!notes || notes.length === 0) {
    alert("No notes to export");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const checkPageBreak = (requiredSpace = 10) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Cover page
  doc.setFontSize(24);
  doc.setFont(undefined, "bold");
  doc.text("My Notes", pageWidth / 2, pageHeight / 2, { align: "center" });
  doc.setFontSize(12);
  doc.setFont(undefined, "normal");
  doc.text(
    `${notes.length} note${notes.length !== 1 ? "s" : ""}`,
    pageWidth / 2,
    pageHeight / 2 + 10,
    { align: "center" }
  );
  doc.text(
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    pageWidth / 2,
    pageHeight / 2 + 20,
    { align: "center" }
  );

  // Add each note
  notes.forEach((note, index) => {
    doc.addPage();
    yPosition = margin;

    // Note number
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Note ${index + 1} of ${notes.length}`, margin, yPosition);
    yPosition += 10;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    const titleLines = doc.splitTextToSize(note.title || "Untitled", maxWidth);
    titleLines.forEach((line) => {
      checkPageBreak(10);
      doc.text(line, margin, yPosition);
      yPosition += 10;
    });

    yPosition += 3;

    // Date
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100);
    const dateStr = new Date(note.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    doc.text(dateStr, margin, yPosition);
    yPosition += 12;

    // Separator
    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Content
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = note.content || "";
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    
    const contentLines = doc.splitTextToSize(plainText || "(Empty note)", maxWidth);
    contentLines.forEach((line) => {
      checkPageBreak(6);
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
  });

  // Return blob and filename
  const fileName = "My_Notes.pdf";
  const blob = doc.output("blob");
  return { blob, fileName };
}
