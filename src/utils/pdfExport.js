import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Extract text with inline formatting info
 */
function extractTextWithFormatting(node) {
  const parts = [];
  
  function traverse(n, isBold = false, isItalic = false) {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = n.textContent;
      // Don't filter out whitespace or empty text - we need it for spacing
      if (text !== null && text !== undefined) {
        parts.push({ text, bold: isBold, italic: isItalic });
      }
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const tag = n.tagName.toLowerCase();
      const newBold = isBold || tag === "strong" || tag === "b";
      const newItalic = isItalic || tag === "em" || tag === "i";
      
      // Handle line breaks
      if (tag === "br") {
        parts.push({ text: "\n", bold: false, italic: false });
      } else {
        Array.from(n.childNodes).forEach((child) => {
          traverse(child, newBold, newItalic);
        });
      }
    }
  }
  
  traverse(node);
  return parts;
}

/**
 * Parse HTML content and extract formatted text with structure
 */
function parseHTMLContent(htmlContent) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent || "";
  
  const elements = [];
  
  function processNode(node, parentType = null) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text && !parentType) {
        elements.push({ type: "text", content: text, parts: [{ text, bold: false, italic: false }] });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      switch (tagName) {
        case "h1":
          const h1Text = node.textContent.trim();
          if (h1Text) {
            elements.push({ type: "h1", content: h1Text, parts: extractTextWithFormatting(node) });
          }
          break;
        case "h2":
          const h2Text = node.textContent.trim();
          if (h2Text) {
            elements.push({ type: "h2", content: h2Text, parts: extractTextWithFormatting(node) });
          }
          break;
        case "h3":
          const h3Text = node.textContent.trim();
          if (h3Text) {
            elements.push({ type: "h3", content: h3Text, parts: extractTextWithFormatting(node) });
          }
          break;
        case "p":
          const pText = node.textContent.trim();
          if (pText) {
            elements.push({ type: "p", content: pText, parts: extractTextWithFormatting(node) });
          }
          break;
        case "blockquote":
          const quoteText = node.textContent.trim();
          if (quoteText) {
            elements.push({ type: "quote", content: quoteText, parts: extractTextWithFormatting(node) });
          }
          break;
        case "pre":
          const preText = node.textContent.trim();
          if (preText) {
            elements.push({ type: "code", content: preText, parts: [{ text: preText, bold: false, italic: false }] });
          }
          break;
        case "code":
          if (!node.closest("pre")) {
            const codeText = node.textContent.trim();
            if (codeText) {
              elements.push({ type: "code", content: codeText, parts: [{ text: codeText, bold: false, italic: false }] });
            }
          }
          break;
        case "ul":
          const listItems = Array.from(node.children).filter(
            (child) => child.tagName.toLowerCase() === "li"
          );
          listItems.forEach((li) => {
            const liText = li.textContent.trim();
            if (liText) {
              elements.push({ type: "bullet", content: liText, parts: extractTextWithFormatting(li) });
            }
          });
          break;
        case "ol":
          const orderedItems = Array.from(node.children).filter(
            (child) => child.tagName.toLowerCase() === "li"
          );
          orderedItems.forEach((li, index) => {
            const liText = li.textContent.trim();
            if (liText) {
              elements.push({ type: "numbered", content: liText, number: index + 1, parts: extractTextWithFormatting(li) });
            }
          });
          break;
        case "br":
          elements.push({ type: "break" });
          break;
        case "div":
        case "span":
        case "section":
        case "article":
          Array.from(node.childNodes).forEach((child) => processNode(child, tagName));
          break;
        default:
          const hasBlockChildren = Array.from(node.children).some((child) => {
            const tag = child.tagName.toLowerCase();
            return ["h1", "h2", "h3", "p", "div", "ul", "ol", "blockquote", "pre"].includes(tag);
          });
          
          if (!hasBlockChildren) {
            const text = node.textContent.trim();
            if (text) {
              elements.push({ type: "text", content: text, parts: extractTextWithFormatting(node) });
            }
          } else {
            Array.from(node.childNodes).forEach((child) => processNode(child, tagName));
          }
      }
    }
  }
  
  Array.from(tempDiv.childNodes).forEach((node) => processNode(node));
  
  if (elements.length === 0) {
    const allText = tempDiv.textContent.trim();
    if (allText) {
      elements.push({ type: "text", content: allText, parts: [{ text: allText, bold: false, italic: false }] });
    }
  }
  
  return elements;
}

/**
 * Generate PDF blob for a single note with HTML formatting preserved
 */
export async function generateNotePDF(note) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to check if we need a new page
  const checkPageBreak = (requiredSpace = 10) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  const titleLines = doc.splitTextToSize(note.title || "Untitled", maxWidth);
  titleLines.forEach((line) => {
    checkPageBreak(12);
    doc.text(line, margin, yPosition);
    yPosition += 12;
  });
  yPosition += 5;

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
  doc.text(dateStr, margin, yPosition);
  yPosition += 10;

  // Separator line
  doc.setDrawColor(221, 221, 221);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Parse and render content
  const elements = parseHTMLContent(note.content);
  
  elements.forEach((element) => {
    switch (element.type) {
      case "h1":
        checkPageBreak(15);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 17, 17);
        const h1Lines = doc.splitTextToSize(element.content, maxWidth);
        h1Lines.forEach((line) => {
          doc.text(line, margin, yPosition);
          yPosition += 10;
        });
        yPosition += 5;
        break;

      case "h2":
        checkPageBreak(12);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 17, 17);
        const h2Lines = doc.splitTextToSize(element.content, maxWidth);
        h2Lines.forEach((line) => {
          doc.text(line, margin, yPosition);
          yPosition += 8;
        });
        yPosition += 4;
        break;

      case "h3":
        checkPageBreak(10);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 17, 17);
        const h3Lines = doc.splitTextToSize(element.content, maxWidth);
        h3Lines.forEach((line) => {
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });
        yPosition += 3;
        break;

      case "p":
      case "text":
        if (element.content) {
          checkPageBreak(7);
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          
          // Check if content has mixed formatting
          const hasBold = element.parts && element.parts.some(p => p.bold);
          
          if (hasBold && element.parts && element.parts.length > 0) {
            // Render inline with mixed formatting
            let xPos = margin;
            
            element.parts.forEach((part) => {
              if (!part.text) return;
              
              const fontStyle = part.bold && part.italic ? "bolditalic" : 
                               part.bold ? "bold" : 
                               part.italic ? "italic" : "normal";
              doc.setFont("helvetica", fontStyle);
              
              // Check if adding this part would exceed line width
              const textWidth = doc.getTextWidth(part.text);
              if (xPos + textWidth > pageWidth - margin && xPos > margin) {
                // Wrap to next line
                yPosition += 7;
                checkPageBreak(7);
                xPos = margin;
              }
              
              doc.text(part.text, xPos, yPosition);
              xPos += textWidth;
            });
            yPosition += 10;
          } else {
            // Simple rendering without mixed formatting
            doc.setFont("helvetica", "normal");
            const pLines = doc.splitTextToSize(element.content, maxWidth);
            pLines.forEach((line) => {
              checkPageBreak(7);
              doc.text(line, margin, yPosition);
              yPosition += 7;
            });
            yPosition += 3;
          }
        }
        break;

      case "quote":
        checkPageBreak(10);
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(85, 85, 85);
        doc.setDrawColor(221, 221, 221);
        doc.setLineWidth(1);
        const quoteLines = doc.splitTextToSize(element.content, maxWidth - 10);
        const quoteStartY = yPosition;
        quoteLines.forEach((line) => {
          checkPageBreak(7);
          doc.text(line, margin + 10, yPosition);
          yPosition += 7;
        });
        doc.line(margin + 2, quoteStartY - 3, margin + 2, yPosition - 3);
        yPosition += 3;
        break;

      case "code":
        checkPageBreak(10);
        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(245, 245, 245);
        const codeLines = doc.splitTextToSize(element.content, maxWidth - 10);
        const codeHeight = codeLines.length * 6 + 6;
        checkPageBreak(codeHeight);
        doc.rect(margin, yPosition - 3, maxWidth, codeHeight, "F");
        codeLines.forEach((line) => {
          doc.text(line, margin + 5, yPosition + 3);
          yPosition += 6;
        });
        yPosition += 6;
        break;

      case "bullet":
        checkPageBreak(7);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.circle(margin + 2, yPosition - 1.5, 1, "F");
        const bulletLines = doc.splitTextToSize(element.content, maxWidth - 10);
        bulletLines.forEach((line, index) => {
          doc.text(line, margin + 8, yPosition);
          if (index < bulletLines.length - 1) {
            yPosition += 6;
            checkPageBreak(6);
          }
        });
        yPosition += 7;
        break;

      case "numbered":
        checkPageBreak(7);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(`${element.number}.`, margin + 2, yPosition);
        const numberedLines = doc.splitTextToSize(element.content, maxWidth - 10);
        numberedLines.forEach((line, index) => {
          doc.text(line, margin + 10, yPosition);
          if (index < numberedLines.length - 1) {
            yPosition += 6;
            checkPageBreak(6);
          }
        });
        yPosition += 7;
        break;

      case "break":
        yPosition += 5;
        break;
    }
  });

  // Return blob and filename
  const fileName = `${(note.title || "Untitled").replace(/[^a-z0-9]/gi, "_")}.pdf`;
  const blob = doc.output("blob");
  return { blob, fileName };
}

/**
 * Generate PDF blob for all notes with HTML formatting preserved
 */
export async function generateAllNotesPDF(notes) {
  if (!notes || notes.length === 0) {
    alert("No notes to export");
    return;
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

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
    yPosition = margin;

    // Note number
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(153, 153, 153);
    doc.text(`Note ${index + 1} of ${notes.length}`, margin, yPosition);
    yPosition += 10;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    const titleLines = doc.splitTextToSize(note.title || "Untitled", maxWidth);
    titleLines.forEach((line) => {
      doc.text(line, margin, yPosition);
      yPosition += 10;
    });
    yPosition += 3;

    // Date
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(102, 102, 102);
    const dateStr = new Date(note.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    doc.text(dateStr, margin, yPosition);
    yPosition += 8;

    // Separator
    doc.setDrawColor(221, 221, 221);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Parse and render content
    const elements = parseHTMLContent(note.content || "<p>(Empty note)</p>");
    
    elements.forEach((element) => {
      switch (element.type) {
        case "h1":
          checkPageBreak(12);
          doc.setFontSize(18);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(17, 17, 17);
          const h1Lines = doc.splitTextToSize(element.content, maxWidth);
          h1Lines.forEach((line) => {
            doc.text(line, margin, yPosition);
            yPosition += 9;
          });
          yPosition += 4;
          break;

        case "h2":
          checkPageBreak(10);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(17, 17, 17);
          const h2Lines = doc.splitTextToSize(element.content, maxWidth);
          h2Lines.forEach((line) => {
            doc.text(line, margin, yPosition);
            yPosition += 7;
          });
          yPosition += 3;
          break;

        case "h3":
          checkPageBreak(8);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(17, 17, 17);
          const h3Lines = doc.splitTextToSize(element.content, maxWidth);
          h3Lines.forEach((line) => {
            doc.text(line, margin, yPosition);
            yPosition += 6;
          });
          yPosition += 2;
          break;

        case "p":
        case "text":
          if (element.content) {
            checkPageBreak(6);
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            
            // Check if content has mixed formatting
            const hasBold = element.parts && element.parts.some(p => p.bold);
            
            if (hasBold && element.parts && element.parts.length > 0) {
              // Render inline with mixed formatting
              let xPos = margin;
              
              element.parts.forEach((part) => {
                if (!part.text) return;
                
                const fontStyle = part.bold && part.italic ? "bolditalic" : 
                                 part.bold ? "bold" : 
                                 part.italic ? "italic" : "normal";
                doc.setFont("helvetica", fontStyle);
                
                // Check if adding this part would exceed line width
                const textWidth = doc.getTextWidth(part.text);
                if (xPos + textWidth > pageWidth - margin && xPos > margin) {
                  // Wrap to next line
                  yPosition += 6;
                  checkPageBreak(6);
                  xPos = margin;
                }
                
                doc.text(part.text, xPos, yPosition);
                xPos += textWidth;
              });
              yPosition += 8;
            } else {
              // Simple rendering without mixed formatting
              doc.setFont("helvetica", "normal");
              const pLines = doc.splitTextToSize(element.content, maxWidth);
              pLines.forEach((line) => {
                checkPageBreak(6);
                doc.text(line, margin, yPosition);
                yPosition += 6;
              });
              yPosition += 2;
            }
          }
          break;

        case "quote":
          checkPageBreak(8);
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(85, 85, 85);
          doc.setDrawColor(221, 221, 221);
          doc.setLineWidth(1);
          const quoteLines = doc.splitTextToSize(element.content, maxWidth - 10);
          const quoteStartY = yPosition;
          quoteLines.forEach((line) => {
            checkPageBreak(6);
            doc.text(line, margin + 10, yPosition);
            yPosition += 6;
          });
          doc.line(margin + 2, quoteStartY - 3, margin + 2, yPosition - 3);
          yPosition += 2;
          break;

        case "code":
          checkPageBreak(8);
          doc.setFontSize(9);
          doc.setFont("courier", "normal");
          doc.setTextColor(0, 0, 0);
          doc.setFillColor(245, 245, 245);
          const codeLines = doc.splitTextToSize(element.content, maxWidth - 10);
          const codeHeight = codeLines.length * 5 + 4;
          checkPageBreak(codeHeight);
          doc.rect(margin, yPosition - 2, maxWidth, codeHeight, "F");
          codeLines.forEach((line) => {
            doc.text(line, margin + 5, yPosition + 2);
            yPosition += 5;
          });
          yPosition += 4;
          break;

        case "bullet":
          checkPageBreak(6);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          doc.circle(margin + 2, yPosition - 1.5, 0.8, "F");
          const bulletLines = doc.splitTextToSize(element.content, maxWidth - 10);
          bulletLines.forEach((line, idx) => {
            doc.text(line, margin + 8, yPosition);
            if (idx < bulletLines.length - 1) {
              yPosition += 5;
              checkPageBreak(5);
            }
          });
          yPosition += 6;
          break;

        case "numbered":
          checkPageBreak(6);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          doc.text(`${element.number}.`, margin + 2, yPosition);
          const numberedLines = doc.splitTextToSize(element.content, maxWidth - 10);
          numberedLines.forEach((line, idx) => {
            doc.text(line, margin + 10, yPosition);
            if (idx < numberedLines.length - 1) {
              yPosition += 5;
              checkPageBreak(5);
            }
          });
          yPosition += 6;
          break;

        case "break":
          yPosition += 4;
          break;
      }
    });
  });

  const fileName = "My_Notes.pdf";
  const blob = doc.output("blob");
  return { blob, fileName };
}

/**
 * Generate a PDF from a rendered editor element to preserve exact styling.
 * This captures the element using html2canvas and places it into a jsPDF document
 * beneath a standard header (title + date). Use this when you need WYSIWYG export.
 *
 * @param {HTMLElement} editorElement - The DOM node of the contentEditable editor (content only)
 * @param {{ title?: string, updatedAt?: string | number | Date }} meta - Note metadata for header
 * @returns {Promise<{ blob: Blob, fileName: string }>} - PDF blob and suggested filename
 */
export async function generateNotePDFFromElement(editorElement, meta = {}) {
  if (!editorElement) {
    throw new Error("editorElement is required for WYSIWYG PDF export");
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header (title + date) similar to text-based export
  const title = meta.title || "Untitled";
  const updatedAt = meta.updatedAt ? new Date(meta.updatedAt) : new Date();

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  const titleLines = doc.splitTextToSize(title, pageWidth - 2 * margin);
  let y = margin;
  titleLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 9;
  });
  y += 3;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(102, 102, 102);
  const dateStr = `Updated: ${updatedAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  doc.text(dateStr, margin, y);
  y += 8;

  // Separator
  doc.setDrawColor(221, 221, 221);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Clone and prepare offscreen container for consistent rendering
  const clone = editorElement.cloneNode(true);
  clone.classList.add("offscreen-pdf");
  clone.style.background = "#ffffff";
  clone.style.padding = "0";
  clone.style.margin = "0";

  const offscreen = document.createElement("div");
  offscreen.style.position = "fixed";
  offscreen.style.left = "-10000px";
  offscreen.style.top = "0";
  offscreen.style.width = `${Math.min(900, editorElement.clientWidth || 800)}px`;
  offscreen.style.background = "#ffffff";
  offscreen.appendChild(clone);
  document.body.appendChild(offscreen);

  try {
    // Render HTML directly with jsPDF (uses html2canvas internally) with sanitized CSS in onclone
    await new Promise((resolve, reject) => {
      try {
        doc.html(clone, {
          x: margin,
          y,
          width: pageWidth - 2 * margin,
          windowWidth: offscreen.clientWidth,
          autoPaging: "text",
          html2canvas: {
            scale: 2,
            backgroundColor: "#ffffff",
            useCORS: true,
            logging: false,
            allowTaint: true,
            foreignObjectRendering: true,
            onclone: (clonedDoc) => {
              const style = clonedDoc.createElement("style");
              style.setAttribute("data-pdf-sanitize", "true");
              style.textContent = `
                .offscreen-pdf, .offscreen-pdf * { color: #111827 !important; }
                .offscreen-pdf h1 { font-size: 30px !important; font-weight: 700 !important; color: #111827 !important; margin: 0 0 16px 0 !important; }
                .offscreen-pdf h2 { font-size: 24px !important; font-weight: 700 !important; color: #111827 !important; margin: 0 0 12px 0 !important; }
                .offscreen-pdf h3 { font-size: 20px !important; font-weight: 700 !important; color: #111827 !important; margin: 0 0 8px 0 !important; }
                .offscreen-pdf p { margin: 0 0 16px 0 !important; line-height: 1.75 !important; }
                .offscreen-pdf ul, .offscreen-pdf ol { margin: 0 0 16px 24px !important; }
                .offscreen-pdf li { margin: 0 0 8px 0 !important; }
                .offscreen-pdf blockquote { border-left: 4px solid #d1d5db !important; padding: 8px 0 8px 16px !important; margin: 16px 0 !important; color: #374151 !important; font-style: italic !important; }
                .offscreen-pdf pre { background: #f3f4f6 !important; border-radius: 8px !important; padding: 16px !important; margin: 16px 0 !important; overflow: hidden !important; }
                .offscreen-pdf code { font-family: 'Courier New', monospace !important; font-size: 14px !important; color: #111827 !important; }
                .offscreen-pdf a { color: #1d4ed8 !important; text-decoration: underline !important; }
                .offscreen-pdf { background: #ffffff !important; }
              `;
              clonedDoc.head.appendChild(style);
            },
          },
          callback: () => resolve(),
        });
      } catch (e) {
        reject(e);
      }
    });

    const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
    const blob = doc.output("blob");
    return { blob, fileName };
  } catch (err) {
    // Fallback path: sanitize <img> and background images, then rasterize with html2canvas
    // This avoids jsPDF drawImage invalid base64 issues from svg/blob sources
    try {
      // Remove problematic images
      clone.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (!/^data:image\/(png|jpeg|jpg);base64,/i.test(src)) {
          // Replace with alt text or nothing
          const alt = img.getAttribute("alt") || "";
          const span = document.createElement("span");
          span.textContent = alt;
          img.replaceWith(span);
        }
      });

      // Strip background-image styles that may contain unsupported data URIs
      clone.querySelectorAll("*").forEach((el) => {
        const bg = (el.style && el.style.backgroundImage) || "";
        if (bg && /url\(/i.test(bg)) {
          el.style.backgroundImage = "none";
        }
      });

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: true,
        windowWidth: offscreen.clientWidth,
        foreignObjectRendering: true,
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      // Draw first page content, under the header drawn earlier
      doc.addImage(imgData, "PNG", margin, y, contentWidth, imgHeight);

      let heightLeft = imgHeight - (pageHeight - y - margin);
      let position = y - imgHeight;
      while (heightLeft > 0) {
        doc.addPage();
        position = margin - (imgHeight - heightLeft);
        doc.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
        heightLeft -= pageHeight - 2 * margin;
      }

      const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      const blob = doc.output("blob");
      return { blob, fileName };
    } catch (innerErr) {
      throw err; // surface original error if fallback also fails
    }
  } finally {
    document.body.removeChild(offscreen);
  }
}
