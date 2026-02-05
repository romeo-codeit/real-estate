// SendGrid is currently disabled - uncomment to reactivate
// import sgMail from '@sendgrid/mail';
// sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static instance: EmailService;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    // SendGrid is currently disabled - emails are logged instead of sent
    console.log('[EMAIL DISABLED] Would have sent email:', {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cardonecapvest.com',
      subject: template.subject,
    });

    // Uncomment below to reactivate SendGrid email sending
    // const msg = {
    //   to,
    //   from: process.env.SENDGRID_FROM_EMAIL!,
    //   subject: template.subject,
    //   html: template.html,
    //   text: template.text,
    // };
    // try {
    //   await sgMail.send(msg);
    // } catch (error) {
    //   console.error('Email send failed:', error);
    //   throw error;
    // }
  }

  // Email verification template
  getEmailVerificationTemplate(verificationUrl: string): EmailTemplate {
    return {
      subject: 'Verify Your Email - Cardone Capvest',
      html: `
        <h1>Welcome to Cardone Capvest</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
      text: `Welcome! Please verify your email by visiting: ${verificationUrl}. This link expires in 24 hours.`,
    };
  }

  // Deposit confirmation template
  getDepositConfirmationTemplate(amount: string, currency: string): EmailTemplate {
    return {
      subject: 'Deposit Confirmation',
      html: `
        <h1>Deposit Successful</h1>
        <p>Your deposit of ${amount} ${currency} has been processed successfully.</p>
        <p>Thank you for your investment!</p>
      `,
      text: `Deposit Successful: ${amount} ${currency} has been processed.`,
    };
  }

  // Withdrawal confirmation template
  getWithdrawalConfirmationTemplate(amount: string, currency: string): EmailTemplate {
    return {
      subject: 'Withdrawal Processed',
      html: `
        <h1>Withdrawal Successful</h1>
        <p>Your withdrawal of ${amount} ${currency} has been processed.</p>
        <p>Funds should arrive in your account within 1-3 business days.</p>
      `,
      text: `Withdrawal Processed: ${amount} ${currency}. Funds arriving soon.`,
    };
  }

  // Investment confirmation template
  getInvestmentConfirmationTemplate(propertyName: string, amount: string, currency: string): EmailTemplate {
    return {
      subject: 'Investment Confirmed',
      html: `
        <h1>Investment Successful</h1>
        <p>You have successfully invested ${amount} ${currency} in ${propertyName}.</p>
        <p>Your investment is now active and earning returns.</p>
      `,
      text: `Investment Confirmed: ${amount} ${currency} in ${propertyName}.`,
    };
  }
}

export const emailService = EmailService.getInstance();