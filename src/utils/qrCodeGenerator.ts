// ============================================================================
// ONE SHOT FMGE — Pure ISO/IEC 18004 Standard QR Code Matrix Generator
// Compatible with Telegram Desktop, Telegram Mobile & all standard QR scanners
// ============================================================================

import QRCode from "qrcode";

/**
 * Generates a valid, scannable ISO/IEC 18004 SVG string representation of a Telegram Login QR Code (tg://login?token=...)
 */
export function generateQrSvg(text: string, size = 256): string {
  if (!text) return "";

  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const moduleCount = qr.modules.size;
  const cellSize = size / moduleCount;

  let svgRects = "";
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.modules.get(r, c)) {
        const x = (c * cellSize).toFixed(2);
        const y = (r * cellSize).toFixed(2);
        const s = cellSize.toFixed(2);
        svgRects += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#0F172A" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#FFFFFF" rx="16" />
    <g transform="translate(12, 12) scale(${(size - 24) / size})">
      ${svgRects}
    </g>
  </svg>`;
}

/**
 * Generates an SVG Data URL suitable for img src (<img src={qrDataUrl} />)
 */
export function generateQrDataUrl(text: string, size = 256): string {
  const svg = generateQrSvg(text, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
