import jsPDF from "jspdf";

/**
 * Strip HTML tags and extract plain text
 */
function stripHTML(html) {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

/**
 * Sanitize text for safe use in PDF
 * Handles special characters without breaking encoding
 */
function sanitizeText(text) {
  if (!text) return "";

  // Just return the text as-is, jsPDF handles UTF-8
  // Only remove truly problematic characters (control characters)
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Parse inline formatting from HTML element
 * Returns array of text segments with styling info: { text, bold, italic, underline }
 */
function parseInlineFormatting(element) {
  const segments = [];

  function traverse(node, inherited = { bold: false, italic: false, underline: false }) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) {
        segments.push({
          text: sanitizeText(text),
          bold: inherited.bold,
          italic: inherited.italic,
          underline: inherited.underline
        });
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const styles = {
        bold: inherited.bold || tag === 'b' || tag === 'strong',
        italic: inherited.italic || tag === 'i' || tag === 'em',
        underline: inherited.underline || tag === 'u'
      };

      // Process children with inherited styles
      Array.from(node.childNodes).forEach(child => traverse(child, styles));
    }
  }

  traverse(element);
  return segments;
}

/**
 * Parse HTML content into structured blocks with inline formatting
 */
function parseContent(html) {
  if (!html) return [];

  const temp = document.createElement("div");
  temp.innerHTML = html;

  const blocks = [];

  function processNode(node) {
    const tag = node.tagName?.toLowerCase();

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({
          type: 'text',
          segments: [{ text: sanitizeText(text), bold: false, italic: false, underline: false }]
        });
      }
      return;
    }

    if (!tag) return;

    switch (tag) {
      case 'h1':
        blocks.push({ type: 'h1', segments: parseInlineFormatting(node) });
        break;
      case 'h2':
        blocks.push({ type: 'h2', segments: parseInlineFormatting(node) });
        break;
      case 'h3':
        blocks.push({ type: 'h3', segments: parseInlineFormatting(node) });
        break;
      case 'p':
      case 'div':  // Handle div tags like paragraphs
        const pSegments = parseInlineFormatting(node);
        if (pSegments.length > 0 && pSegments.some(s => s.text.trim())) {
          blocks.push({ type: 'p', segments: pSegments });
        }
        break;
      case 'blockquote':
        const quoteSegments = parseInlineFormatting(node);
        if (quoteSegments.length > 0 && quoteSegments.some(s => s.text.trim())) {
          blocks.push({ type: 'quote', segments: quoteSegments });
        }
        break;
      case 'pre':
      case 'code':
        const codeText = node.textContent?.trim();
        if (codeText && !node.closest('pre')) {
          blocks.push({ type: 'code', segments: [{ text: sanitizeText(codeText), bold: false, italic: false, underline: false }] });
        } else if (codeText && tag === 'pre') {
          blocks.push({ type: 'code', segments: [{ text: sanitizeText(codeText), bold: false, italic: false, underline: false }] });
        }
        break;
      case 'ul':
        Array.from(node.children).forEach(li => {
          if (li.tagName?.toLowerCase() === 'li') {
            const liSegments = parseInlineFormatting(li);
            if (liSegments.length > 0 && liSegments.some(s => s.text.trim())) {
              blocks.push({ type: 'bullet', segments: liSegments });
            }
          }
        });
        break;
      case 'ol':
        Array.from(node.children).forEach((li, idx) => {
          if (li.tagName?.toLowerCase() === 'li') {
            const liSegments = parseInlineFormatting(li);
            if (liSegments.length > 0 && liSegments.some(s => s.text.trim())) {
              blocks.push({ type: 'numbered', segments: liSegments, number: idx + 1 });
            }
          }
        });
        break;
      case 'br':
        blocks.push({ type: 'break' });
        break;
      default:
        // Process children for container elements
        Array.from(node.childNodes).forEach(child => processNode(child));
    }
  }

  Array.from(temp.childNodes).forEach(node => processNode(node));

  // If no blocks were parsed, try to get plain text
  if (blocks.length === 0) {
    const plainText = sanitizeText(temp.textContent?.trim() || '');
    if (plainText) {
      blocks.push({
        type: 'text',
        segments: [{ text: plainText, bold: false, italic: false, underline: false }]
      });
    }
  }

  return blocks;
}

/**
 * Render styled text segments on a line
 * Returns the final Y position after rendering
 */
function renderStyledText(doc, segments, x, y, maxWidth, lineHeight = 7) {
  if (!segments || segments.length === 0) return y;

  let currentX = x;
  const underlineSegments = []; // Track segments that need underlines

  segments.forEach((segment) => {
    if (!segment.text) return;

    // Determine font style
    let fontStyle = 'normal';
    if (segment.bold && segment.italic) {
      fontStyle = 'bolditalic';
    } else if (segment.bold) {
      fontStyle = 'bold';
    } else if (segment.italic) {
      fontStyle = 'italic';
    }

    doc.setFont('helvetica', fontStyle);

    const text = segment.text;
    let words = text.split(/\s+/); // Split by whitespace

    words.forEach((word, idx) => {
      if (!word) return;

      // Add space before word (except first word and first word of line)
      const wordWithSpace = (idx > 0 || currentX > x) ? ' ' + word : word;
      const wordWidth = doc.getTextWidth(wordWithSpace);

      // Check if word fits on current line
      if (currentX + wordWidth > x + maxWidth && currentX > x) {
        // Move to next line
        y += lineHeight;
        currentX = x;
        // Don't add space at start of new line
        const wordText = word;
        const wordW = doc.getTextWidth(wordText);
        doc.text(wordText, currentX, y);

        if (segment.underline) {
          underlineSegments.push({ x: currentX, y, width: wordW, lineY: y + 0.5 });
        }
        currentX += wordW;
      } else {
        // Word fits on current line
        doc.text(wordWithSpace, currentX, y);

        if (segment.underline) {
          underlineSegments.push({ x: currentX, y, width: wordWidth, lineY: y + 0.5 });
        }
        currentX += wordWidth;
      }
    });
  });

  // Draw all underlines
  if (underlineSegments.length > 0) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    underlineSegments.forEach(u => {
      doc.line(u.x, u.lineY, u.x + u.width, u.lineY);
    });
  }

  return y;
}

/**
 * Render blocks to PDF with inline formatting support
 */
function renderBlocks(doc, blocks, margin, maxWidth, startY) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;

  const checkPageBreak = (requiredSpace = 10) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  blocks.forEach(block => {
    switch (block.type) {
      case 'h1':
        checkPageBreak(15);
        doc.setFontSize(20);
        doc.setTextColor(17, 17, 17);
        y = renderStyledText(doc, block.segments, margin, y, maxWidth, 10);
        y += 15;
        break;

      case 'h2':
        checkPageBreak(12);
        doc.setFontSize(16);
        doc.setTextColor(17, 17, 17);
        y = renderStyledText(doc, block.segments, margin, y, maxWidth, 8);
        y += 12;
        break;

      case 'h3':
        checkPageBreak(10);
        doc.setFontSize(14);
        doc.setTextColor(17, 17, 17);
        y = renderStyledText(doc, block.segments, margin, y, maxWidth, 7);
        y += 10;
        break;

      case 'p':
      case 'text':
        checkPageBreak(7);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        y = renderStyledText(doc, block.segments, margin, y, maxWidth, 7);
        y += 10;
        break;

      case 'quote':
        checkPageBreak(10);
        doc.setFontSize(11);
        doc.setTextColor(85, 85, 85);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(2);
        const quoteStartY = y;
        y = renderStyledText(doc, block.segments, margin + 15, y, maxWidth - 15, 7);
        doc.line(margin + 5, quoteStartY - 3, margin + 5, y + 3);
        y += 10;
        break;

      case 'code':
        checkPageBreak(10);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(245, 245, 245);

        // Combine all segments into plain text for code blocks
        const codeText = block.segments.map(s => s.text).join('');
        const codeLines = doc.splitTextToSize(codeText, maxWidth - 10);
        const codeHeight = codeLines.length * 6 + 6;
        checkPageBreak(codeHeight);

        doc.rect(margin, y - 3, maxWidth, codeHeight, "F");
        doc.setFont("courier", "normal");
        codeLines.forEach(line => {
          doc.text(line, margin + 5, y + 3);
          y += 6;
        });
        y += 6;
        break;

      case 'bullet':
        checkPageBreak(7);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.circle(margin + 2, y - 1.5, 1, "F");
        y = renderStyledText(doc, block.segments, margin + 8, y, maxWidth - 10, 7);
        y += 7;
        break;

      case 'numbered':
        checkPageBreak(7);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text(`${block.number}.`, margin + 2, y);
        y = renderStyledText(doc, block.segments, margin + 12, y, maxWidth - 12, 7);
        y += 7;
        break;

      case 'break':
        y += 5;
        break;
    }
  });

  return y;
}

/**
 * Export a single note to PDF
 */
export async function generateNotePDF(note) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let y = margin;

    // Title
    const title = sanitizeText(note.title || "Untitled");
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    const titleLines = doc.splitTextToSize(title, maxWidth);
    titleLines.forEach(line => {
      doc.text(line, margin, y);
      y += 12;
    });
    y += 5;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(102, 102, 102);
    const dateStr = `Updated: ${new Date(note.updatedAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    doc.text(dateStr, margin, y);
    y += 10;

    // Separator
    doc.setDrawColor(221, 221, 221);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Content
    const blocks = parseContent(note.content);
    renderBlocks(doc, blocks, margin, maxWidth, y);

    // Return blob and filename
    const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
    const blob = doc.output("blob");
    return { blob, fileName };
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
}

/**
 * Export all notes to a single PDF
 */
export async function generateAllNotesPDF(notes) {
  if (!notes || notes.length === 0) {
    throw new Error("No notes to export");
  }

  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Cover page
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("My Notes", pageWidth / 2, pageHeight / 2 - 20, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${notes.length} note${notes.length !== 1 ? "s" : ""}`,
      pageWidth / 2,
      pageHeight / 2,
      { align: "center" }
    );

    doc.setFontSize(12);
    doc.setTextColor(102, 102, 102);
    doc.text(
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      pageWidth / 2,
      pageHeight / 2 + 10,
      { align: "center" }
    );

    // Add each note
    notes.forEach((note, index) => {
      doc.addPage();
      let y = margin;

      // Note number
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(153, 153, 153);
      doc.text(`Note ${index + 1} of ${notes.length}`, margin, y);
      y += 10;

      // Title
      const title = sanitizeText(note.title || "Untitled");
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 17, 17);
      const titleLines = doc.splitTextToSize(title, maxWidth);
      titleLines.forEach(line => {
        doc.text(line, margin, y);
        y += 10;
      });
      y += 3;

      // Date
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(102, 102, 102);
      const dateStr = new Date(note.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      doc.text(dateStr, margin, y);
      y += 8;

      // Separator
      doc.setDrawColor(221, 221, 221);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Content
      const blocks = parseContent(note.content || "<p>(Empty note)</p>");
      renderBlocks(doc, blocks, margin, maxWidth, y);
    });

    const fileName = "My_Notes.pdf";
    const blob = doc.output("blob");
    return { blob, fileName };
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
}

/**
 * Export a single note from the editor element (simplified)
 * This version extracts text from the DOM and uses the standard text-based export
 */
export async function generateNotePDFFromElement(editorElement, meta = {}) {
  try {
    if (!editorElement) {
      throw new Error("Editor element is required");
    }

    // Extract content from the editor
    const content = editorElement.innerHTML || "";

    // Create a note object
    const note = {
      title: meta.title || "Untitled",
      content: content,
      updatedAt: meta.updatedAt || new Date(),
    };

    // Use the standard PDF generation
    return await generateNotePDF(note);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF. Please try again.");
  }
}
