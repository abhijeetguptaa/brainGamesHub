import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { PDF_CONFIG, CANVAS_CONFIG } from '../constants/mathAppConstants.js';
import { FILE_SETTINGS, MATH_OPERATORS } from '../constants/appConstants.js';
import {
  generateQuestion,
  generateCustomQuestion,
  getOperator,
  loadImageAsBase64,
  isCordovaOrCapacitor,
  hasCordovaFileAndSharing,
  b64toBlob,
} from './utils.js';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function sharePdfWithCapacitor(pdfBlob, fileName, t) {
  const base64Data = await blobToBase64(pdfBlob);
  const path = `pdf/${Date.now()}-${fileName}`;

  await Filesystem.writeFile({
    path,
    data: base64Data,
    directory: Directory.Cache,
    recursive: true,
  });

  const { uri } = await Filesystem.getUri({
    path,
    directory: Directory.Cache,
  });

  await Share.share({
    title: t('mathApp.pdf.shareTitle'),
    text: t('mathApp.pdf.shareText'),
    files: [uri],
    dialogTitle: t('mathApp.pdf.shareTitle'),
  });
}

async function deliverPdf(pdfBlob, fileName, t) {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Filesystem')) {
    try {
      await sharePdfWithCapacitor(pdfBlob, fileName, t);
      return;
    } catch (err) {
      console.error('Capacitor PDF share error:', err);
    }
  }

  const isNative = isCordovaOrCapacitor();
  const hasPlugins = hasCordovaFileAndSharing();

  if (isNative && hasPlugins) {
    savePdfToFile(pdfBlob, fileName, function (err, fileUrl) {
      if (err) {
        alert(t('mathApp.pdf.failedToSave') + err);
        console.error('Cordova file save error:', err);
      } else {
        sharePdfWithCordova(fileUrl, t);
      }
    });
    return;
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })
  ) {
    try {
      await navigator.share({
        files: [new File([pdfBlob], fileName, { type: 'application/pdf' })],
        title: t('mathApp.pdf.shareTitle'),
        text: t('mathApp.pdf.shareText'),
      });
      return;
    } catch (err) {
      alert(t('mathApp.pdf.sharingFailed') + err);
      console.error('Web Share API error:', err);
      return;
    }
  }

  try {
    if (window && window.URL && window.URL.createObjectURL) {
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      requestAnimationFrame(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
      console.log(t('mathApp.pdf.downloadedMessage'));
    } else {
      throw new Error(t('mathApp.pdf.downloadNotSupported'));
    }
  } catch (err) {
    alert(t('mathApp.pdf.sharingAndDownloadNotSupported'));
    console.error(t('mathApp.pdf.noSupport'), err);
  }
}

// Helper function to add student information line at bottom of PDF
export function addStudentInfoLine(doc, t) {
  const lineY = PDF_CONFIG.PAGE_HEIGHT - PDF_CONFIG.BOTTOM_MARGIN;

  // Set font for student info
  doc.setFontSize(PDF_CONFIG.STUDENT_INFO_FONT_SIZE);
  doc.setFont(undefined, 'normal');

  // Student Name
  doc.text(t('mathApp.studentInfo.name'), PDF_CONFIG.MARGIN, lineY);
  doc.line(
    PDF_CONFIG.MARGIN + PDF_CONFIG.STUDENT_INFO.NAME_OFFSET,
    lineY + 1,
    PDF_CONFIG.MARGIN + PDF_CONFIG.STUDENT_INFO.NAME_OFFSET + PDF_CONFIG.STUDENT_INFO.LINE_LENGTH,
    lineY + 1,
  );

  // Date
  doc.text(
    t('mathApp.studentInfo.date'),
    PDF_CONFIG.MARGIN + PDF_CONFIG.STUDENT_INFO.FIELD_SPACING,
    lineY,
  );
  doc.line(
    PDF_CONFIG.MARGIN + PDF_CONFIG.STUDENT_INFO.FIELD_SPACING + PDF_CONFIG.STUDENT_INFO.DATE_OFFSET,
    lineY + 1,
    PDF_CONFIG.MARGIN +
      PDF_CONFIG.STUDENT_INFO.FIELD_SPACING +
      PDF_CONFIG.STUDENT_INFO.DATE_OFFSET +
      PDF_CONFIG.STUDENT_INFO.LINE_LENGTH,
    lineY + 1,
  );

  // Class
  doc.text(
    t('mathApp.studentInfo.class'),
    PDF_CONFIG.MARGIN + PDF_CONFIG.STUDENT_INFO.FIELD_SPACING * 2,
    lineY,
  );
  doc.line(
    PDF_CONFIG.MARGIN +
      PDF_CONFIG.STUDENT_INFO.FIELD_SPACING * 2 +
      PDF_CONFIG.STUDENT_INFO.CLASS_OFFSET,
    lineY + 1,
    PDF_CONFIG.MARGIN +
      PDF_CONFIG.STUDENT_INFO.FIELD_SPACING * 2 +
      PDF_CONFIG.STUDENT_INFO.CLASS_OFFSET +
      PDF_CONFIG.STUDENT_INFO.LINE_LENGTH,
    lineY + 1,
  );
}

// Helper function to add watermark to PDF
export function addWatermarkToPdf(doc, t) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = CANVAS_CONFIG.CROSS_ORIGIN;
    img.onload = function () {
      try {
        // Create a canvas to process the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext(CANVAS_CONFIG.CONTEXT_TYPE);

        // Set canvas size to match A4 dimensions
        canvas.width = PDF_CONFIG.PAGE_WIDTH * PDF_CONFIG.WATERMARK.DPI_CONVERSION;
        canvas.height = PDF_CONFIG.PAGE_HEIGHT * PDF_CONFIG.WATERMARK.DPI_CONVERSION;

        // Fill canvas with semi-transparent background
        ctx.fillStyle = `rgba(255, 255, 255, ${PDF_CONFIG.WATERMARK.BACKGROUND_OPACITY})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate dimensions to cover the whole page while maintaining aspect ratio
        const imgAspectRatio = img.width / img.height;
        const pageAspectRatio = canvas.width / canvas.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspectRatio > pageAspectRatio) {
          // Image is wider, fit to height
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspectRatio;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller, fit to width
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspectRatio;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        }

        // Set global alpha for transparency
        ctx.globalAlpha = PDF_CONFIG.WATERMARK.OPACITY;

        // Draw the image to cover the whole page
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Convert canvas to data URL
        const watermarkDataUrl = canvas.toDataURL(CANVAS_CONFIG.IMAGE_FORMAT);

        // Add watermark to PDF (behind all content) with margins
        const watermarkWidth =
          PDF_CONFIG.PAGE_WIDTH * (1 - 2 * PDF_CONFIG.WATERMARK.MARGIN_PERCENT);
        const watermarkHeight =
          PDF_CONFIG.PAGE_HEIGHT * (1 - 2 * PDF_CONFIG.WATERMARK.MARGIN_PERCENT);
        const xOffset = PDF_CONFIG.PAGE_WIDTH * PDF_CONFIG.WATERMARK.MARGIN_PERCENT;
        const yOffset = PDF_CONFIG.PAGE_HEIGHT * PDF_CONFIG.WATERMARK.MARGIN_PERCENT;

        doc.addImage(
          watermarkDataUrl,
          'PNG',
          xOffset,
          yOffset,
          watermarkWidth,
          watermarkHeight,
          undefined,
          'NONE',
        );

        resolve();
      } catch {
        resolve(); // Continue without watermark
      }
    };

    img.onerror = function () {
      console.warn(t('mathApp.watermark.failedToLoad'));
      resolve(); // Continue without watermark
    };

    // Load the logo from public folder
    img.src = '/logo.webp';
  });
}

export async function downloadPdfFile(selectedOperator, selectedComplexity, numPages = 1, t) {
  const qrImageBase64 = await loadImageAsBase64('/app_QR.webp');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Add watermark to the first page
  await addWatermarkToPdf(doc, t);
  const set1Ops = [
    MATH_OPERATORS.Addition,
    MATH_OPERATORS.Subtraction,
    MATH_OPERATORS.Multiplication,
    MATH_OPERATORS.Division,
  ];
  const set2Ops = [
    MATH_OPERATORS.Comparison,
    MATH_OPERATORS.Ascending,
    MATH_OPERATORS.Descending,
  ];
  doc.setFontSize(16);
  doc.text(`${t('mathApp.pdf.title')}${selectedOperator.toUpperCase()}`, 15, 15);
  doc.setFontSize(14);
  let yStart = 25;
  for (let page = 0; page < numPages; page++) {
    if (page > 0) {
      doc.addPage();
      // Add watermark to each new page
      await addWatermarkToPdf(doc, t);
      doc.setFontSize(16);
      doc.text(`${t('mathApp.pdf.title')}${selectedOperator.toUpperCase()}`, 15, 15);
      doc.setFontSize(14);
      yStart = 25;
    }
    if (set1Ops.includes(selectedOperator)) {
      const problems = [];
      for (let i = 0; i < 24; i++) {
        const q = generateQuestion(selectedOperator, selectedComplexity);
        const op = getOperator(selectedOperator);
        problems.push({
          num1: q.num1,
          num2: q.num2,
          op: op === '__DIVIDE_IMAGE__' || op === '/' ? '÷' : op,
        });
      }
      const cols = 4,
        rows = 6;
      const boxW = 45,
        boxH = 40;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const x = 15 + c * boxW;
          const y = yStart + r * boxH;

          doc.setLineWidth(0.5);
          doc.setDrawColor(0, 0, 0);
          doc.rect(x, y, boxW, boxH);

          /* ============================
         LAST CELL → QR CODE
      ============================ */
          if (r === rows - 1 && c === cols - 1) {
            const padding = 6;
            const qrSize = Math.min(boxW, boxH) - padding * 2;

            doc.addImage(
              qrImageBase64,
              'PNG',
              x + (boxW - qrSize) / 2,
              y + (boxH - qrSize) / 2,
              qrSize,
              qrSize,
            );

            continue; // skip question rendering
          }

          /* ============================
         EXISTING QUESTION LOGIC
      ============================ */
          const centerX = x + boxW / 2;
          doc.setFontSize(13);

          const num1Str = String(problems[idx].num1);
          const num2Str = String(problems[idx].num2);
          const op = problems[idx].op;

          const num1Width = doc.getTextWidth(num1Str);
          const num2Width = doc.getTextWidth(num2Str);
          const opWidth = doc.getTextWidth(op);

          const rightEdge = centerX + Math.max(num1Width, num2Width) / 2;

          doc.text(num1Str, rightEdge, y + 14, { align: 'right' });

          const margin = 1.4;
          doc.setFont(undefined, 'bold');
          doc.setFontSize(15);

          const opX = rightEdge - num2Width - opWidth - margin;
          doc.text(op, opX, y + 20, { align: 'left' });

          doc.setFont(undefined, 'normal');
          doc.setFontSize(13);
          doc.text(num2Str, rightEdge, y + 20, { align: 'right' });

          doc.setLineWidth(0.5);
          doc.line(x + 6, y + 24, x + boxW - 6, y + 24);
        }
      }
    } else if (set2Ops.includes(selectedOperator)) {
      const problems = [];
      for (let i = 0; i < 48; i++) {
        const q = generateQuestion(selectedOperator, selectedComplexity);
        if (selectedOperator === 'Ascending' || selectedOperator === 'Descending') {
          problems.push(`${q.numbers.join('_')} =`);
        } else if (selectedOperator === 'Comparison') {
          problems.push(`${q.num1} _ ${q.num2} =`);
        }
      }
      const cols = 2,
        rows = 24;
      const boxW = 85,
        boxH = 10;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const x = 15 + c * boxW;
          const y = yStart + r * boxH;
          doc.setLineWidth(0.5);
          doc.setDrawColor(0, 0, 0);
          doc.rect(x, y, boxW, boxH);
          doc.text(problems[idx], x + 3, y + boxH / 2 + 2, { align: 'left', baseline: 'middle' });
        }
      }
    }
    // Add student information line at bottom of each page
    addStudentInfoLine(doc, t);
  }
  const pdfBlob = doc.output('blob');
  const fileName = FILE_SETTINGS.DEFAULT_PDF_NAME;
  await deliverPdf(pdfBlob, fileName, t);
}

export async function downloadCustomWorksheetPdf(selectedOperator, range1, range2, numPages = 1, t) {
  const qrImageBase64 = await loadImageAsBase64('/app_QR.webp');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Add watermark to the first page
  await addWatermarkToPdf(doc, t);
  
  doc.setFontSize(16);
  doc.text(`${t('mathApp.pdf.title')}${selectedOperator.toUpperCase()}`, 15, 15);
  doc.setFontSize(14);
  let yStart = 25;
  for (let page = 0; page < numPages; page++) {
    if (page > 0) {
      doc.addPage();
      // Add watermark to each new page
      await addWatermarkToPdf(doc, t);
      doc.setFontSize(16);
      doc.text(`${t('mathApp.pdf.title')}${selectedOperator.toUpperCase()}`, 15, 15);
      doc.setFontSize(14);
      yStart = 25;
    }
    
    const problems = [];
    for (let i = 0; i < 24; i++) {
      const q = generateCustomQuestion(selectedOperator, range1, range2);
      const op = getOperator(selectedOperator);
      problems.push({
        num1: q.num1,
        num2: q.num2,
        op: op === '__DIVIDE_IMAGE__' || op === '/' ? '÷' : op,
      });
    }
    const cols = 4,
      rows = 6;
    const boxW = 45,
      boxH = 40;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const x = 15 + c * boxW;
        const y = yStart + r * boxH;

        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.rect(x, y, boxW, boxH);

        /* ============================
       LAST CELL → QR CODE
    ============================ */
        if (r === rows - 1 && c === cols - 1) {
          const padding = 6;
          const qrSize = Math.min(boxW, boxH) - padding * 2;

          doc.addImage(
            qrImageBase64,
            'PNG',
            x + (boxW - qrSize) / 2,
            y + (boxH - qrSize) / 2,
            qrSize,
            qrSize,
          );

          continue; // skip question rendering
        }

        /* ============================
       EXISTING QUESTION LOGIC
    ============================ */
        const centerX = x + boxW / 2;
        doc.setFontSize(13);

        const num1Str = String(problems[idx].num1);
        const num2Str = String(problems[idx].num2);
        const op = problems[idx].op;

        const num1Width = doc.getTextWidth(num1Str);
        const num2Width = doc.getTextWidth(num2Str);
        const opWidth = doc.getTextWidth(op);

        const rightEdge = centerX + Math.max(num1Width, num2Width) / 2;

        doc.text(num1Str, rightEdge, y + 14, { align: 'right' });

        const margin = 1.4;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(15);

        const opX = rightEdge - num2Width - opWidth - margin;
        doc.text(op, opX, y + 20, { align: 'left' });

        doc.setFont(undefined, 'normal');
        doc.setFontSize(13);
        doc.text(num2Str, rightEdge, y + 20, { align: 'right' });

        doc.setLineWidth(0.5);
        doc.line(x + 6, y + 24, x + boxW - 6, y + 24);
      }
    }
    
    // Add student information line at bottom of each page
    addStudentInfoLine(doc, t);
  }
  const pdfBlob = doc.output('blob');
  const fileName = FILE_SETTINGS.DEFAULT_PDF_NAME;
  await deliverPdf(pdfBlob, fileName, t);
}

export async function downloadPassagePdf(passage, t) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Add watermark to the first page
  await addWatermarkToPdf(doc, t);

  // Set Title
  doc.setFontSize(24);
  doc.text(passage.title, 15, 15);

  // Set Passage Content
  doc.setFontSize(16);
  const passageLines = doc.splitTextToSize(passage.passage, 180);
  doc.text(passageLines, 15, 25);

  let yStart = 25 + passageLines.length * 7; // arough estimation of text height

  // Set Questions
  doc.setFontSize(12);
  for (const [qIndex, q] of passage.questions.entries()) {
    if (yStart > 250) {
      doc.addPage();
      await addWatermarkToPdf(doc, t);
      yStart = 15;
    }
    yStart += 10;
    const questionLines = doc.splitTextToSize(`${qIndex + 1}. ${q.question}`, 180);
    doc.text(questionLines, 15, yStart);
    yStart += questionLines.length * 7;

    q.options.forEach((option) => {
      yStart += 7;
      doc.text(`  - ${option}`, 20, yStart);
    });
  }

  // Add student information line at bottom of each page
  addStudentInfoLine(doc, t);

  const pdfBlob = doc.output('blob');
  const fileName = FILE_SETTINGS.DEFAULT_PASSAGE_PDF_NAME;
  await deliverPdf(pdfBlob, fileName, t);
}

// Helper to save PDF to file using Cordova File plugin
export function savePdfToFile(pdfBlob, fileName, callback) {
  const reader = new FileReader();
  reader.onloadend = function () {
    const base64data = reader.result.split(',')[1]; // Remove data:application/pdf;base64,
    // Save to device
    window.resolveLocalFileSystemURL(
      window.cordova.file.cacheDirectory || window.cordova.file.externalDataDirectory,
      function (dirEntry) {
        dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
          fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function () {
              callback(null, fileEntry.nativeURL);
            };
            fileWriter.onerror = function (e) {
              callback(e);
            };
            const dataBlob = b64toBlob(base64data, 'application/pdf');
            fileWriter.write(dataBlob);
          });
        });
      },
      function (err) {
        callback(err);
      },
    );
  };
  reader.readAsDataURL(pdfBlob);
}

// Helper to share PDF using Cordova Social Sharing plugin
export function sharePdfWithCordova(fileUrl, t) {
  if (window.plugins && window.plugins.socialsharing) {
    window.plugins.socialsharing.share(
      t('mathApp.pdf.shareText'),
      t('mathApp.pdf.shareTitle'),
      fileUrl,
      null,
      function () {
        console.log(t('mathApp.pdf.shareSuccess'));
      },
      function (err) {
        alert(t('mathApp.pdf.shareFailed') + err);
      },
    );
  } else {
    alert(t('mathApp.pdf.sharingNotAvailable'));
  }
}
