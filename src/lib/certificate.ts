// lib/certificate.ts
// npm i pdf-lib qrcode
// npm i -D @types/qrcode
//
// Coursera/Udemy-style landscape A4 certificate:
// clean white page, thin frame, serif name, QR + ID, signature block.

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { readFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// ---- Config: edit these ----------------------------------------------------
const CONFIG = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.org",
  courseTitle: "Safe from Harm",
  eventLine: "Scout Moot 2026  |  Dhaka, Bangladesh",
  signatoryName: "A B M Abdus Sattar",
  // TODO(organizer): Confirm his official designation with the organizers
  // before launch. This is a placeholder title, not his confirmed role.
  signatoryTitle: "Authorized Signatory, Scout Moot 2026",
  // Optional PNG files (transparent background) in /public
  signatureFile: "signature-abm-abdus-sattar.png",
  logoFile: "scout-logo.png",
};

const GREEN = rgb(0.0, 0.33, 0.2);
const GOLD = rgb(0.72, 0.58, 0.25);
const INK = rgb(0.12, 0.12, 0.14);
const MUTED = rgb(0.4, 0.4, 0.45);

export function newCertificateId() {
  // e.g. SFH26-K7M2QX9A (no confusing chars like 0/O/1/I)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `SFH26-${code}`;
}

// Standard PDF fonts only support Latin characters. Collect an
// "English name for certificate" at registration and sanitize here.
function latinOnly(s: string) {
  return s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "").trim();
}

function centered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = INK
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

async function optionalPng(doc: PDFDocument, file: string) {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", file));
    return await doc.embedPng(buf);
  } catch {
    return null; // file not provided yet
  }
}

export async function generateCertificate(opts: {
  certId: string;
  fullName: string;
  issuedAt: Date;
}) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Certificate - ${CONFIG.courseTitle}`);
  doc.setAuthor("Scout Moot 2026");

  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  const { width: W, height: H } = page.getSize();

  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Frame: thick green outer, thin gold inner
  page.drawRectangle({ x: 20, y: 20, width: W - 40, height: H - 40, borderColor: GREEN, borderWidth: 3 });
  page.drawRectangle({ x: 30, y: 30, width: W - 60, height: H - 60, borderColor: GOLD, borderWidth: 0.8 });

  // Logo (optional)
  const logo = await optionalPng(doc, CONFIG.logoFile);
  let top = H - 70;
  if (logo) {
    const lh = 56;
    const lw = (logo.width / logo.height) * lh;
    page.drawImage(logo, { x: (W - lw) / 2, y: H - 70 - lh, width: lw, height: lh });
    top = H - 70 - lh - 18;
  }

  // Heading
  centered(page, "CERTIFICATE OF COMPLETION", top - 14, sansBold, 13, GREEN);
  page.drawLine({ start: { x: W / 2 - 40, y: top - 26 }, end: { x: W / 2 + 40, y: top - 26 }, thickness: 1.2, color: GOLD });

  // Body
  centered(page, "This is to certify that", top - 62, serifItalic, 15, MUTED);

  const name = latinOnly(opts.fullName) || "Participant";
  let nameSize = 44;
  while (serifBold.widthOfTextAtSize(name, nameSize) > W - 160 && nameSize > 24) nameSize -= 2;
  centered(page, name, top - 112, serifBold, nameSize);
  page.drawLine({
    start: { x: 150, y: top - 126 },
    end: { x: W - 150, y: top - 126 },
    thickness: 0.6,
    color: MUTED,
  });

  centered(page, "has successfully completed the online course", top - 156, serifItalic, 15, MUTED);
  centered(page, CONFIG.courseTitle, top - 196, serifBold, 30, GREEN);
  centered(page, CONFIG.eventLine, top - 222, sans, 12, MUTED);

  // ---- Footer row ----------------------------------------------------------
  const footY = 78;

  // Left: issue date
  const dateStr = opts.issuedAt.toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka",
  });
  page.drawText(dateStr, { x: 70, y: footY + 40, size: 13, font: serifBold, color: INK });
  page.drawLine({ start: { x: 70, y: footY + 32 }, end: { x: 250, y: footY + 32 }, thickness: 0.6, color: MUTED });
  page.drawText("Date of issue", { x: 70, y: footY + 18, size: 9.5, font: sans, color: MUTED });

  // Center: QR code + verification text
  const verifyUrl = `${CONFIG.siteUrl}/verify/${opts.certId}`;
  const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 0, width: 300 });
  const qr = await doc.embedPng(qrPng);
  const qrSize = 70;
  page.drawImage(qr, { x: (W - qrSize) / 2, y: footY + 8, width: qrSize, height: qrSize });

  // Right: signature
  const sigRight = W - 70;
  const sigLeft = sigRight - 190;
  const sig = await optionalPng(doc, CONFIG.signatureFile);
  if (sig) {
    const sh = 42;
    const sw = Math.min((sig.width / sig.height) * sh, 170);
    page.drawImage(sig, { x: sigLeft + (190 - sw) / 2, y: footY + 38, width: sw, height: sh });
  }
  page.drawLine({ start: { x: sigLeft, y: footY + 34 }, end: { x: sigRight, y: footY + 34 }, thickness: 0.6, color: MUTED });
  const sn = CONFIG.signatoryName;
  page.drawText(sn, {
    x: sigLeft + (190 - sansBold.widthOfTextAtSize(sn, 11.5)) / 2,
    y: footY + 20, size: 11.5, font: sansBold, color: INK,
  });
  const st = CONFIG.signatoryTitle;
  page.drawText(st, {
    x: sigLeft + (190 - sans.widthOfTextAtSize(st, 8.5)) / 2,
    y: footY + 8, size: 8.5, font: sans, color: MUTED,
  });

  // Bottom line: ID + verify link
  centered(page, `Certificate ID: ${opts.certId}`, 52, sansBold, 9, INK);
  centered(page, `Verify this certificate at ${verifyUrl}`, 40, sans, 8.5, MUTED);

  return doc.save(); // Uint8Array
}

/* ---- app/api/certificate/[id]/route.ts -------------------------------------

import { generateCertificate } from "@/lib/certificate";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!cert) return new Response("Not found", { status: 404 });

  const pdf = await generateCertificate({
    certId: cert.id,
    fullName: cert.user.nameEn,
    issuedAt: cert.issuedAt,
  });
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cert.id}.pdf"`,
    },
  });
}

---------------------------------------------------------------------------- */
