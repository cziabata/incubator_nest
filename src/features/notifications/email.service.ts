import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      const info = await this.mailerService.sendMail({
        from: this.configService.get<string>('EMAIL'),
        to,
        subject,
        html,
      });
      console.log('Email sent:', info.response);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendConfirmationEmail(
    email: string,
    confirmationCode: string,
  ): Promise<void> {
    const subject = 'Confirm your registration';
    const html = this.registrationEmailTemplate(confirmationCode);
    await this.sendEmail(email, subject, html);
  }

  async sendPasswordRecoveryEmail(
    email: string,
    confirmationCode: string,
  ): Promise<void> {
    const subject = 'Password recovery';
    const html = this.passwordRecoveryEmailTemplate(confirmationCode);
    await this.sendEmail(email, subject, html);
  }

  private registrationEmailTemplate(confirmationCode: string): string {
    return `<h1>Thank for your registration</h1>
    <p>To finish registration please follow the link below:<br>
       <a href='https://some-front.com/confirm-registration?code=${confirmationCode}'>complete registration</a>
   </p>`;
  }

  private passwordRecoveryEmailTemplate(confirmationCode: string): string {
    return `
      <h1>Password recovery</h1>
      <p>To finish password recovery please follow the link below:
      <a href='https://somesite.com/password-recovery?recoveryCode=${confirmationCode}'>recovery password</a>
      </p>
     `;
  }
}
