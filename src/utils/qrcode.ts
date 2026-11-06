import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#090D16',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}
