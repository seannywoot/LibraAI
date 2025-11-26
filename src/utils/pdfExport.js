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
        const h1Segments = parseInlineFormatting(node);
        blocks.push({ type: 'h1', segments: h1Segments });
        break;
      case 'h2':
        const h2Segments = parseInlineFormatting(node);
        blocks.push({ type: 'h2', segments: h2Segments });
        break;
      case 'h3':
        const h3Segments = parseInlineFormatting(node);
        blocks.push({ type: 'h3', segments: h3Segments });
        break;
      case 'p':
      case 'div':  // Handle div tags like paragraphs
        const pSegments = parseInlineFormatting(node);
        if (pSegments.length > 0 && pSegments.some(s => s.text.trim())) {
          // Check if this paragraph/div contains a heading or list that should be parsed
          const hasHeading = node.querySelector('h1, h2, h3');
          const hasCode = node.querySelector('pre, code');
          const hasList = node.querySelector('ul, ol');

          if (hasHeading || hasCode || hasList) {
            // Process children separately to catch nested headings/code/lists
            Array.from(node.childNodes).forEach(child => processNode(child));
          } else {
            blocks.push({ type: 'p', segments: pSegments });
          }
        }
        break;
      case 'blockquote':
        const quoteSegments = parseInlineFormatting(node);
        if (quoteSegments.length > 0 && quoteSegments.some(s => s.text.trim())) {
          blocks.push({ type: 'quote', segments: quoteSegments });
        }
        break;
      case 'pre':
        // Pre tags should contain code - preserve all whitespace and newlines
        // Clone the node to avoid modifying the original DOM
        const preClone = node.cloneNode(true);
        // Replace all <br> tags with actual newlines
        const brTags = preClone.querySelectorAll('br');
        brTags.forEach(br => {
          br.replaceWith(document.createTextNode('\n'));
        });
        const preText = preClone.textContent;
        if (preText) {
          // Debug: show what we're getting including newlines
          console.log('CODE BLOCK RAW:', JSON.stringify(preText));
          console.log('CODE BLOCK LENGTH:', preText.length);
          console.log('CODE BLOCK LINES:', preText.split('\n').length);
          // Don't trim! Preserve exact formatting
          blocks.push({ type: 'code', segments: [{ text: sanitizeText(preText), bold: false, italic: false, underline: false }] });
        }
        break;
      case 'code':
        // Only parse standalone code tags, not those inside pre
        if (!node.closest('pre')) {
          // Clone and replace br tags with newlines
          const codeClone = node.cloneNode(true);
          const brTags = codeClone.querySelectorAll('br');
          brTags.forEach(br => {
            br.replaceWith(document.createTextNode('\n'));
          });
          const codeText = codeClone.textContent;
          if (codeText) {
            blocks.push({ type: 'code', segments: [{ text: sanitizeText(codeText), bold: false, italic: false, underline: false }] });
          }
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
  let previousBlockType = null;

  const checkPageBreak = (requiredSpace = 10) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  blocks.forEach((block, index) => {
    // Check if we're transitioning from a list item to a non-list block
    const isListBlock = block.type === 'bullet' || block.type === 'numbered';
    const wasListBlock = previousBlockType === 'bullet' || previousBlockType === 'numbered';

    // Add extra spacing after a list ends (when transitioning from list to non-list)
    if (wasListBlock && !isListBlock && previousBlockType !== null) {
      y += 8; // Add extra spacing to simulate list margin-bottom
    }

    switch (block.type) {
      case 'h1':
        checkPageBreak(15);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 17, 17);
        // Render headings with bold font by default
        const h1Segments = block.segments.map(s => ({ ...s, bold: true }));
        y = renderStyledText(doc, h1Segments, margin, y, maxWidth, 8);
        y += 10; // Increased from 8 to match 1rem spacing
        break;

      case 'h2':
        checkPageBreak(12);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 17, 17);
        const h2Segments = block.segments.map(s => ({ ...s, bold: true }));
        y = renderStyledText(doc, h2Segments, margin, y, maxWidth, 7);
        y += 8; // Increased from 6 to match 0.75rem spacing
        break;

      case 'h3':
        checkPageBreak(10);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 17, 17);
        const h3Segments = block.segments.map(s => ({ ...s, bold: true }));
        y = renderStyledText(doc, h3Segments, margin, y, maxWidth, 6);
        y += 6; // Increased from 5 to match 0.5rem spacing
        break;

      case 'p':
      case 'text':
        checkPageBreak(7);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        y = renderStyledText(doc, block.segments, margin, y, maxWidth, 6);
        y += 10; // Increased from 6 to match 1rem spacing
        break;

      case 'quote':
        checkPageBreak(10);
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81); // Darker gray for better readability
        doc.setDrawColor(209, 213, 219); // Light gray border
        doc.setLineWidth(2);
        const quoteStartY = y;
        // Make quote text italic by default
        const quoteSegments = block.segments.map(s => ({ ...s, italic: true }));
        y = renderStyledText(doc, quoteSegments, margin + 10, y, maxWidth - 10, 6);
        // Draw left border for blockquote (thicker and more visible)
        doc.line(margin + 3, quoteStartY - 1, margin + 3, y + 1);
        y += 10; // Increased from 6 to match 1rem spacing
        // Reset text color for subsequent blocks
        doc.setTextColor(0, 0, 0);
        break;

      case 'code':
        checkPageBreak(10);
        doc.setFontSize(9);

        // Combine all segments into plain text for code blocks
        const codeText = block.segments.map(s => s.text).join('');
        // Use courier font for measuring
        doc.setFont("courier", "normal");

        // Split on actual newlines to preserve formatting
        const codeLines = codeText.split('\n');
        const codeHeight = codeLines.length * 5 + 8;
        checkPageBreak(codeHeight);

        // Set colors for the code block background
        doc.setFillColor(243, 244, 246); // Light gray background
        doc.setDrawColor(243, 244, 246); // Same color for border (no visible border)

        // Draw background rectangle with padding
        doc.rect(margin, y - 2, maxWidth, codeHeight, "F");

        // Set text color to black for the code text
        doc.setTextColor(0, 0, 0);

        // Draw each line exactly as it appears, preserving indentation
        codeLines.forEach((line, idx) => {
          // Don't trim - preserve exact spacing and indentation
          doc.text(line, margin + 4, y + 3 + (idx * 5));
        });
        y += codeHeight + 10; // Increased from +2 to match 1rem spacing
        break;

      case 'bullet':
        checkPageBreak(7);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        // Draw bullet with proper indentation (smaller bullet size)
        doc.circle(margin + 5, y - 1.5, 0.75, "F");
        y = renderStyledText(doc, block.segments, margin + 12, y, maxWidth - 12, 6);
        y += 4; // Spacing between list items
        break;

      case 'numbered':
        checkPageBreak(7);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        // Draw number with proper indentation
        doc.text(`${block.number}.`, margin + 5, y);
        y = renderStyledText(doc, block.segments, margin + 15, y, maxWidth - 15, 6);
        y += 4; // Spacing between list items
        break;

      case 'break':
        y += 5;
        break;
    }

    previousBlockType = block.type;
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
    y += 2;

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
    y += 6;

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
