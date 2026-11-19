import { ConfigService } from '@nestjs/config';
import { S3StorageProvider } from './s3-storage.provider';

/**
 * The URL an upload returns is what the applicant's form sends back, and the
 * application DTOs accept only https links. So whatever AWS_S3_CUSTOM_DOMAIN
 * says, the URL handed out must be https. (Without AWS credentials the
 * provider runs in its dev mode and only builds the URL, which is what these
 * tests exercise.)
 */
const object = {
  key: 'documents/0b6f.pdf',
  body: Buffer.from('%PDF-1.7'),
  contentType: 'application/pdf',
};

const provider = (values: Record<string, string>) =>
  new S3StorageProvider(new ConfigService(values));

describe('S3StorageProvider URLs', () => {
  it('uses the bucket host over https by default', async () => {
    const { url } = await provider({
      AWS_S3_BUCKET_NAME: 'world-portal-documents',
      AWS_REGION: 'eu-west-2',
    }).uploadFile(object);

    expect(url).toBe(
      'https://world-portal-documents.s3.eu-west-2.amazonaws.com/documents/0b6f.pdf',
    );
  });

  it('keeps an https custom domain as it is', async () => {
    const { url } = await provider({
      AWS_S3_CUSTOM_DOMAIN: 'https://documents.example.com/',
    }).uploadFile(object);

    expect(url).toBe('https://documents.example.com/documents/0b6f.pdf');
  });

  it('serves an http custom domain over https', async () => {
    const { url } = await provider({
      AWS_S3_CUSTOM_DOMAIN: 'http://documents.example.com',
    }).uploadFile(object);

    expect(url).toBe('https://documents.example.com/documents/0b6f.pdf');
  });

  it('adds https to a custom domain given without a scheme', async () => {
    const { url } = await provider({
      AWS_S3_CUSTOM_DOMAIN: 'documents.example.com',
    }).uploadFile(object);

    expect(url).toBe('https://documents.example.com/documents/0b6f.pdf');
  });
});
