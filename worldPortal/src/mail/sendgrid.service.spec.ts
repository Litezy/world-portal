import { ConfigService } from '@nestjs/config';
import { SendGridService } from './sendgrid.service';

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

const mailMock = jest.requireMock<{
  send: jest.Mock<Promise<unknown>, [{ to: string; html: string }]>;
}>('@sendgrid/mail');

describe('SendGrid OTP delivery', () => {
  const originalKey = process.env.SENDGRID_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.SENDGRID_API_KEY;
    else process.env.SENDGRID_API_KEY = originalKey;
  });

  it('reports missing configuration without simulating delivery', async () => {
    const service = new SendGridService(new ConfigService());
    await expect(
      service.sendOtpEmail('test@example.com', '123456'),
    ).resolves.toBe(false);
    expect(mailMock.send).not.toHaveBeenCalled();
  });

  it('submits the code to SendGrid and reports provider acceptance', async () => {
    const service = new SendGridService(
      new ConfigService({ SENDGRID_API_KEY: 'test-key' }),
    );
    mailMock.send.mockResolvedValueOnce([]);
    await expect(
      service.sendOtpEmail('test@example.com', '123456'),
    ).resolves.toBe(true);
    const message = mailMock.send.mock.calls[0][0];
    expect(message.to).toBe('test@example.com');
    expect(message.html).toContain('123456');
  });

  it('reports provider rejection', async () => {
    const service = new SendGridService(
      new ConfigService({ SENDGRID_API_KEY: 'test-key' }),
    );
    mailMock.send.mockRejectedValueOnce(new Error('provider rejected'));
    await expect(
      service.sendOtpEmail('test@example.com', '123456'),
    ).resolves.toBe(false);
  });
});
