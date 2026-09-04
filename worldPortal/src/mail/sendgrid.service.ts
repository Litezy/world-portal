import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';

export interface SendApplicationEmailOptions {
  to: string;
  recipientName: string;
  applicationNo: string;
  targetCountry: string;
  visaCategory?: string;
}

export function formatReviewerName(nameOrEmail?: string): string {
  if (!nameOrEmail) return 'Admin Consultant';
  if (!nameOrEmail.includes('@')) return nameOrEmail;

  const handle = nameOrEmail.split('@')[0];
  const parts = handle.split(/[._\-+]/).filter(Boolean);
  if (parts.length === 0) return 'Admin Consultant';

  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

export interface SendCostEvaluatedEmailOptions {
  to: string;
  recipientName: string;
  applicationNo: string;
  targetCountry: string;
  totalAmount: number;
  currency?: string;
  allowInstallment: boolean;
  evaluatorEmail: string;
  evaluatorName?: string;
  bankAccounts?: Array<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    swiftCode?: string;
    iban?: string;
    routingNumber?: string;
    currency?: string;
    instructions?: string;
  }>;
}

export interface SendPaymentConfirmedEmailOptions {
  to: string;
  recipientName: string;
  applicationNo: string;
  amountPaid: number;
  balanceDue: number;
  paymentOption: string;
}

export interface SendStatusUpdateEmailOptions {
  to: string;
  recipientName: string;
  applicationNo: string;
  targetCountry: string;
  reviewerEmail: string;
  reviewerName?: string;
  rejectionReason?: string;
}

export interface SendTeamInviteEmailOptions {
  to: string;
  recipientName: string;
  role: string;
  inviterEmail: string;
  inviterName?: string;
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly frontendUrl: string;
  private readonly isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('SENDGRID_API_KEY') || process.env.SENDGRID_API_KEY;
    this.fromEmail =
      this.configService.get<string>('SENDGRID_FROM_EMAIL') ||
      process.env.SENDGRID_FROM_EMAIL ||
      'noreply@thetradefactor.com';
    this.fromName =
      this.configService.get<string>('SENDGRID_FROM_NAME') ||
      process.env.SENDGRID_FROM_NAME ||
      'E-Embassy';

    const rawFrontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL ||
      'https://thetradefactor.com';
    this.frontendUrl = rawFrontendUrl.replace(/\/+$/, '');

    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      this.logger.log(`SendGrid configured with sender: ${this.fromName} <${this.fromEmail}>`);
    } else {
      this.logger.warn(
        `SENDGRID_API_KEY is missing in environment variables. Email dispatches will log mock payloads until API key is set.`,
      );
    }
  }

  /**
   * 1. Application Submitted Email
   */
  async sendApplicationConfirmationEmail(options: SendApplicationEmailOptions): Promise<boolean> {
    const { to, recipientName, applicationNo, targetCountry, visaCategory } = options;

    const data = {
      recipient_name: recipientName,
      application_no: applicationNo,
      target_country: targetCountry,
      visa_category: visaCategory || 'Tourist',
      tracking_url: `${this.frontendUrl}/track?ref=${applicationNo}`,
      from_email: this.fromEmail,
      year: new Date().getFullYear(),
    };

    const html = await this.renderEjsTemplate('application-confirmation.ejs', data);

    return this.dispatchMail({
      to,
      subject: `Application Received - ${applicationNo} (${targetCountry})`,
      html,
      ref: applicationNo,
    });
  }

  /**
   * 2. Cost Evaluation Completed Email
   */
  async sendCostEvaluatedEmail(options: SendCostEvaluatedEmailOptions): Promise<boolean> {
    const {
      to,
      recipientName,
      applicationNo,
      targetCountry,
      totalAmount,
      currency,
      allowInstallment,
      evaluatorEmail,
      evaluatorName,
      bankAccounts,
    } = options;

    const formattedEvaluatorName = evaluatorName || formatReviewerName(evaluatorEmail);

    const data = {
      recipient_name: recipientName,
      application_no: applicationNo,
      target_country: targetCountry,
      total_amount: totalAmount,
      currency: currency || 'USD',
      allow_installment: allowInstallment,
      evaluator_email: evaluatorEmail,
      evaluator_name: formattedEvaluatorName,
      bank_accounts: bankAccounts || [],
      payment_url: `${this.frontendUrl}/track?ref=${applicationNo}`,
      from_email: this.fromEmail,
      year: new Date().getFullYear(),
    };

    const html = await this.renderEjsTemplate('application-evaluated.ejs', data);

    return this.dispatchMail({
      to,
      subject: `Action Required: Payment Request for Application ${applicationNo}`,
      html,
      ref: applicationNo,
    });
  }

  /**
   * 3. Payment Confirmed & In Review Email
   */
  async sendPaymentConfirmedEmail(options: SendPaymentConfirmedEmailOptions): Promise<boolean> {
    const { to, recipientName, applicationNo, amountPaid, balanceDue, paymentOption } = options;

    const data = {
      recipient_name: recipientName,
      application_no: applicationNo,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      payment_option: paymentOption,
      tracking_url: `${this.frontendUrl}/track?ref=${applicationNo}`,
      from_email: this.fromEmail,
      year: new Date().getFullYear(),
    };

    const html = await this.renderEjsTemplate('payment-confirmed.ejs', data);

    return this.dispatchMail({
      to,
      subject: `Payment Confirmed - Application ${applicationNo} Under Review`,
      html,
      ref: applicationNo,
    });
  }

  /**
   * 4. Application Approved Email
   */
  async sendApplicationApprovedEmail(options: SendStatusUpdateEmailOptions): Promise<boolean> {
    const { to, recipientName, applicationNo, targetCountry, reviewerEmail, reviewerName } = options;

    const formattedReviewerName = reviewerName || formatReviewerName(reviewerEmail);

    const data = {
      recipient_name: recipientName,
      application_no: applicationNo,
      target_country: targetCountry,
      reviewer_email: reviewerEmail,
      reviewer_name: formattedReviewerName,
      tracking_url: `${this.frontendUrl}/track?ref=${applicationNo}`,
      from_email: this.fromEmail,
      year: new Date().getFullYear(),
    };

    const html = await this.renderEjsTemplate('application-approved.ejs', data);

    return this.dispatchMail({
      to,
      subject: `Congratulations! Application ${applicationNo} Approved`,
      html,
      ref: applicationNo,
    });
  }

  /**
   * 5. Application Rejected Email
   */
  async sendApplicationRejectedEmail(options: SendStatusUpdateEmailOptions): Promise<boolean> {
    const { to, recipientName, applicationNo, targetCountry, reviewerEmail, reviewerName, rejectionReason } = options;

    const formattedReviewerName = reviewerName || formatReviewerName(reviewerEmail);

    const data = {
      recipient_name: recipientName,
      application_no: applicationNo,
      target_country: targetCountry,
      rejection_reason: rejectionReason,
      reviewer_email: reviewerEmail,
      reviewer_name: formattedReviewerName,
      tracking_url: `${this.frontendUrl}/track?ref=${applicationNo}`,
      from_email: this.fromEmail,
      year: new Date().getFullYear(),
    };

    const html = await this.renderEjsTemplate('application-rejected.ejs', data);

    return this.dispatchMail({
      to,
      subject: `Application Status Update: ${applicationNo}`,
      html,
      ref: applicationNo,
    });
  }

  /**
   * 6. Team Invitation Email
   */
  async sendTeamInviteEmail(options: SendTeamInviteEmailOptions): Promise<boolean> {
    const { to, recipientName, role, inviterEmail, inviterName } = options;

    const formattedInviterName = inviterName || formatReviewerName(inviterEmail);

    const data = {
      recipient_name: recipientName,
      to_email: to,
      role,
      inviter_email: inviterEmail,
      inviter_name: formattedInviterName,
      login_url: `${this.frontendUrl}/admin/login`,
      from_email: this.fromEmail,
      year: new Date().getFullYear(),
    };

    const html = await this.renderEjsTemplate('team-invite.ejs', data);

    return this.dispatchMail({
      to,
      subject: `Invitation: Join E-Embassy Console as ${role}`,
      html,
      ref: `INVITE-${to}`,
    });
  }

  /**
   * 7. OTP Email Verification
   */
  async sendOtpEmail(to: string, otpCode: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">E-Embassy Verification Code</h2>
        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">Your 6-digit email verification code is:</p>
        <div style="background-color: #f1f5f9; text-align: center; padding: 16px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a; margin-bottom: 24px;">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `;

    return this.dispatchMail({
      to,
      subject: `${otpCode} is your E-Embassy verification code`,
      html,
      ref: `OTP-${to}`,
    });
  }

  /**
   * SendGrid Dispatch Helper
   */
  private async dispatchMail(options: { to: string; subject: string; html: string; ref: string }): Promise<boolean> {
    const { to, subject, html, ref } = options;

    const msg: sgMail.MailDataRequired = {
      to,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject,
      html,
    };

    if (!this.isConfigured) {
      this.logger.log(`[SENDGRID MOCK DISPATCH] To: ${to} | Subject: ${subject} | Ref: ${ref}`);
      return true;
    }

    try {
      await sgMail.send(msg);
      this.logger.log(`[SENDGRID SUCCESS] Email dispatched successfully to ${to} for ref=${ref}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `[SENDGRID FAILED] Could not send email to ${to}: ${error?.response?.body?.errors?.[0]?.message || error?.message}`,
        error?.stack,
      );
      return false;
    }
  }

  private async renderEjsTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    try {
      const possiblePaths = [
        path.join(__dirname, 'templates', templateName),
        path.join(process.cwd(), 'src', 'mail', 'templates', templateName),
        path.join(process.cwd(), 'dist', 'mail', 'templates', templateName),
      ];

      let foundPath = possiblePaths.find((p) => fs.existsSync(p));

      if (foundPath) {
        return await ejs.renderFile(foundPath, data);
      }

      this.logger.warn(`EJS template ${templateName} not found on disk, using inline fallback`);
      return `<h2>Notice for ${data.application_no || data.recipient_name}</h2><p>Please check your application status.</p>`;
    } catch (err: any) {
      this.logger.error(`Error rendering EJS template ${templateName}: ${err?.message}`);
      return `<h2>Notice for ${data.application_no || data.recipient_name}</h2>`;
    }
  }
}
