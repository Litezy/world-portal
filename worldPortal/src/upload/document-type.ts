/** The most an applicant document may weigh: 10MB. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface DocumentType {
  mime: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'pdf' | 'jpg' | 'png' | 'webp';
}

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) =>
  buffer.length >= offset + bytes.length &&
  bytes.every((byte, i) => buffer[offset + i] === byte);

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

const SIGNATURES: Array<DocumentType & { matches: (b: Buffer) => boolean }> = [
  {
    mime: 'application/pdf',
    extension: 'pdf',
    matches: (b) => startsWith(b, ascii('%PDF-')),
  },
  {
    mime: 'image/png',
    extension: 'png',
    matches: (b) =>
      startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    mime: 'image/jpeg',
    extension: 'jpg',
    matches: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  {
    mime: 'image/webp',
    extension: 'webp',
    matches: (b) =>
      startsWith(b, ascii('RIFF')) && startsWith(b, ascii('WEBP'), 8),
  },
];

/**
 * What a file actually is, read from its first bytes (its "magic number"),
 * or null when it is none of the allowed document types.
 *
 * The client's MIME type and file name are claims anyone can set, so neither
 * is consulted: an HTML page labelled `application/pdf` is refused here, and a
 * PNG labelled as a PDF is stored as the PNG it is. Deliberately small and
 * dependency-free: four formats, checked at fixed offsets.
 */
export function detectDocumentType(buffer: Buffer): DocumentType | null {
  const match = SIGNATURES.find((signature) => signature.matches(buffer));
  return match ? { mime: match.mime, extension: match.extension } : null;
}
