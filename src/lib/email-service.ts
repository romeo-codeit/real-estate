import 'server-only';
// SendGrid is currently disabled - uncomment to reactivate
// import sgMail from '@sendgrid/mail';

// SendGrid initialization disabled - uncomment to reactivate
// if (!process.env.SENDGRID_API_KEY) {
//   throw new Error('SENDGRID_API_KEY environment variable is required');
// }
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@cardonecapvest.com';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    // SendGrid is currently disabled - emails are logged instead of sent
    console.log('[EMAIL DISABLED] Would have sent email:', {
      to,
      from: this.fromEmail,
      subject: template.subject,
      // html and text omitted from logs for brevity
    });

    // Uncomment below to reactivate SendGrid email sending
    // try {
    //   const msg = {
    //     to,
    //     from: this.fromEmail,
    //     subject: template.subject,
    //     html: template.html,
    //     text: template.text,
    //   };
    //   await sgMail.send(msg);
    // } catch (error) {
    //   console.error('Failed to send email:', error);
    //   throw new Error('Email sending failed');
    // }
  }

  // Email verification template
  getEmailVerificationTemplate(verificationUrl: string, userName: string): EmailTemplate {
    return {
      subject: 'Verify Your Email - Cardone Capvest',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Cardone Capvest</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Thank you for registering! Please verify your email address to complete your account setup.</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
              <p>This link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${userName},\n\nThank you for registering! Please verify your email address by clicking this link: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
    };
  }

  // Deposit confirmation template
  getDepositConfirmationTemplate(
    userName: string,
    amount: string,
    currency: string,
    transactionId: string
  ): EmailTemplate {
    return {
      subject: `Deposit Confirmation - ${amount} ${currency}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Deposit Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .amount { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Deposit Confirmed</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Your deposit has been successfully processed!</p>
              <div class="amount">${amount} ${currency}</div>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p>Your funds are now available in your account.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${userName},\n\nYour deposit has been successfully processed!\n\nAmount: ${amount} ${currency}\nTransaction ID: ${transactionId}\n\nYour funds are now available in your account.`,
    };
  }

  // Withdrawal confirmation template
  getWithdrawalConfirmationTemplate(
    userName: string,
    amount: string,
    currency: string,
    transactionId: string
  ): EmailTemplate {
    return {
      subject: `Withdrawal Processed - ${amount} ${currency}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Withdrawal Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .amount { font-size: 24px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Withdrawal Processed</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Your withdrawal request has been processed successfully.</p>
              <div class="amount">${amount} ${currency}</div>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p>Please allow 1-3 business days for the funds to appear in your account.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${userName},\n\nYour withdrawal request has been processed successfully.\n\nAmount: ${amount} ${currency}\nTransaction ID: ${transactionId}\n\nPlease allow 1-3 business days for the funds to appear in your account.`,
    };
  }

  // Investment confirmation template
  getInvestmentConfirmationTemplate(
    userName: string,
    propertyName: string,
    amount: string,
    currency: string,
    transactionId: string
  ): EmailTemplate {
    return {
      subject: `Investment Confirmed - ${propertyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Investment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .amount { font-size: 24px; font-weight: bold; color: #8b5cf6; text-align: center; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Investment Confirmed</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Congratulations! Your investment has been successfully processed.</p>
              <p><strong>Property:</strong> ${propertyName}</p>
              <div class="amount">${amount} ${currency}</div>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p>You will start receiving returns based on the property's performance.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${userName},\n\nCongratulations! Your investment has been successfully processed.\n\nProperty: ${propertyName}\nAmount: ${amount} ${currency}\nTransaction ID: ${transactionId}\n\nYou will start receiving returns based on the property's performance.`,
    };
  }
}