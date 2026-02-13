import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

type MulterFile = Express.Multer.File;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  private readonly logoBase64: string;
  private readonly logoUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.error('RESEND_API_KEY not found in environment variables. Email service will be disabled.');
      this.logger.error('Please add RESEND_API_KEY to your Railway environment variables.');
    } else {
      this.resend = new Resend(apiKey);
    }

    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@exstrat.com';
    
    // URL du logo comme fallback (Gmail préfère souvent les URLs)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://app.exstrat.com';
    const cleanFrontendUrl = frontendUrl.replace(/\/$/, '');
    this.logoUrl = `${cleanFrontendUrl}/Full_logo.png`;
    
    // Charger le logo en base64 pour l'intégrer directement dans les emails
    // Gmail peut bloquer les grandes images base64, donc on utilise aussi une URL
    try {
      // Essayer plusieurs chemins possibles
      const possiblePaths = [
        path.join(__dirname, '../../logo/Full_logo.png'), // Depuis dist/email (production compilée)
        path.join(process.cwd(), 'logo/Full_logo.png'), // Depuis la racine du projet
        path.join(process.cwd(), 'dist/logo/Full_logo.png'), // Depuis dist (si logo copié)
      ];
      
      let logoPath: string | null = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          logoPath = possiblePath;
          break;
        }
      }
      
      if (!logoPath) {
        throw new Error(`Logo file not found. Tried: ${possiblePaths.join(', ')}`);
      }
      const logoBuffer = fs.readFileSync(logoPath);
      this.logoBase64 = logoBuffer.toString('base64');
    } catch (error: any) {
      this.logger.error(`Failed to load logo: ${error.message}`);
      this.logger.error(`Current working directory: ${process.cwd()}`);
      this.logger.error(`__dirname: ${__dirname}`);
      this.logoBase64 = ''; // Fallback si le logo ne peut pas être chargé
    }
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is missing. Emails will not be sent.');
    }
  }

  /**
   * Envoie un email d'alerte pour une stratégie
   */
  async sendStrategyAlert(data: {
    to: string;
    userName: string;
    strategyName: string;
    tokenSymbol: string;
    currentPrice: number;
    targetPrice: number;
    stepOrder: string;
  }): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured, skipping email');
      return;
    }

    const { to, userName, strategyName, tokenSymbol, currentPrice, targetPrice, stepOrder } =
      data;

    try {
      const subject = `Target Price Reached - ${tokenSymbol} Strategy`;
      const html = this.generateStrategyAlertEmail({
        userName,
        strategyName,
        tokenSymbol,
        currentPrice,
        targetPrice,
        stepOrder,
      });

      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });
    } catch (error: any) {
      this.logger.error(`Error sending strategy alert email to ${to}:`, error);
      this.logger.error(`Error details:`, {
        message: error?.message,
        name: error?.name,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw error;
    }
  }

  /**
   * Envoie un email d'alerte pour un TP
   */
  async sendTPAlert(data: {
    to: string;
    userName: string;
    tokenSymbol: string;
    currentPrice: number;
    targetPrice: number;
    tpOrder: number;
  }): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured, skipping email');
      return;
    }

    const { to, userName, tokenSymbol, currentPrice, targetPrice, tpOrder } = data;

    try {
      const subject = `TP${tpOrder} Reached - ${tokenSymbol}`;
      const html = this.generateTPAlertEmail({
        userName,
        tokenSymbol,
        currentPrice,
        targetPrice,
        tpOrder,
      });

      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });
    } catch (error: any) {
      this.logger.error(`Error sending TP alert email to ${to}:`, error);
      this.logger.error(`Error details:`, {
        message: error?.message,
        name: error?.name,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw error;
    }
  }

  /**
   * Génère le HTML pour l'email d'alerte de stratégie
   */
  private generateStrategyAlertEmail(data: {
    userName: string;
    strategyName: string;
    tokenSymbol: string;
    currentPrice: number;
    targetPrice: number;
    stepOrder: string;
  }): string {
    const { userName, strategyName, tokenSymbol, currentPrice, targetPrice, stepOrder } = data;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #25292E;
              background-color: #f5f7fa;
              padding: 20px;
              margin: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              border: 1px solid #e9ecef;
            }
            .header {
              background: #047DD5;
              padding: 40px 30px;
              text-align: center;
            }
            .logo-container {
              margin-bottom: 25px;
              text-align: center;
            }
            .logo {
              width: 200px;
              height: auto;
              max-width: 100%;
              display: block;
              margin: 0 auto;
            }
            .header-title {
              color: #ffffff;
              font-size: 24px;
              font-weight: 600;
              margin: 0;
              letter-spacing: -0.3px;
            }
            .content {
              padding: 40px 35px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 17px;
              color: #25292E;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .message {
              font-size: 15px;
              color: #666;
              margin-bottom: 28px;
              line-height: 1.7;
            }
            .strategy-name {
              color: #047DD5;
              font-weight: 700;
            }
            .info-card {
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-left: 4px solid #047DD5;
              padding: 24px;
              margin: 30px 0;
              border-radius: 6px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-size: 14px;
              color: #666;
              font-weight: 500;
            }
            .info-value {
              font-size: 16px;
              color: #25292E;
              font-weight: 600;
            }
            .price-highlight {
              font-size: 32px;
              font-weight: 700;
              color: #047DD5;
              text-align: center;
              padding: 16px;
              background: #ffffff;
              border: 1px solid #e9ecef;
              border-radius: 6px;
              margin: 15px 0;
            }
            .action-text {
              font-size: 15px;
              color: #25292E;
              margin: 32px 0 24px;
              text-align: center;
              font-weight: 500;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              background: #047DD5;
              color: #ffffff !important;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 15px;
              text-align: center;
              box-shadow: 0 2px 8px rgba(4, 125, 213, 0.3);
              margin: 0 auto;
              display: block;
              width: fit-content;
              letter-spacing: 0.3px;
              border: none;
            }
            .button:hover {
              background: #1665C0;
              box-shadow: 0 4px 12px rgba(4, 125, 213, 0.4);
            }
            .footer {
              background: #f8f9fa;
              padding: 25px 30px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer-text {
              font-size: 12px;
              color: #999;
              line-height: 1.6;
            }
            .footer-link {
              color: #047DD5;
              text-decoration: none;
            }
            @media only screen and (max-width: 600px) {
              body { padding: 10px; }
              .content { padding: 30px 20px; }
              .header { padding: 30px 20px; }
              .header-title { font-size: 24px; }
              .price-highlight { font-size: 28px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo-container">
                <img src="${this.logoBase64 ? `data:image/png;base64,${this.logoBase64}` : this.logoUrl}" alt="exStrat Logo" width="200" height="auto" style="width: 200px; height: auto; max-width: 100%; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" class="logo" />
              </div>
              <h1 class="header-title">Target Price Reached</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello ${userName},</p>
              <p class="message">
                Great news! Your target price has been reached for your strategy 
                <span class="strategy-name">${strategyName}</span>.
              </p>
              
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Token</span>
                  <span class="info-value">${tokenSymbol}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Target</span>
                  <span class="info-value">TP${stepOrder}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Target Price</span>
                  <span class="info-value">$${targetPrice.toFixed(2)}</span>
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                  <div class="price-highlight">$${currentPrice.toFixed(2)}</div>
                  <div style="text-align: center; color: #666; font-size: 13px; margin-top: 8px; font-weight: 500;">Current Price</div>
                </div>
              </div>

              <p class="action-text">It's time to take action! Consider executing your sell order according to your strategy.</p>
              
              <a href="https://app.exstrat.com/strategies" class="button">View Strategy</a>
            </div>
            <div class="footer">
              <p class="footer-text">
                This is an automated alert from <strong>exStrat</strong>.<br>
                You can manage your alerts in your <a href="https://app.exstrat.com/configuration" class="footer-link">account settings</a>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Génère le HTML pour l'email d'alerte de TP
   */
  private generateTPAlertEmail(data: {
    userName: string;
    tokenSymbol: string;
    currentPrice: number;
    targetPrice: number;
    tpOrder: number;
  }): string {
    const { userName, tokenSymbol, currentPrice, targetPrice, tpOrder } = data;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #25292E;
              background-color: #f5f7fa;
              padding: 20px;
              margin: 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              border: 1px solid #e9ecef;
            }
            .header {
              background: #047DD5;
              padding: 40px 30px;
              text-align: center;
            }
            .logo-container {
              margin-bottom: 25px;
              text-align: center;
            }
            .logo {
              width: 200px;
              height: auto;
              max-width: 100%;
              display: block;
              margin: 0 auto;
            }
            .header-title {
              color: #ffffff;
              font-size: 24px;
              font-weight: 600;
              margin: 0;
              letter-spacing: -0.3px;
            }
            .content {
              padding: 40px 35px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 17px;
              color: #25292E;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .message {
              font-size: 15px;
              color: #666;
              margin-bottom: 28px;
              line-height: 1.7;
            }
            .token-symbol {
              color: #047DD5;
              font-weight: 700;
            }
            .info-card {
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-left: 4px solid #047DD5;
              padding: 24px;
              margin: 30px 0;
              border-radius: 6px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-size: 14px;
              color: #666;
              font-weight: 500;
            }
            .info-value {
              font-size: 16px;
              color: #25292E;
              font-weight: 600;
            }
            .price-highlight {
              font-size: 32px;
              font-weight: 700;
              color: #047DD5;
              text-align: center;
              padding: 16px;
              background: #ffffff;
              border: 1px solid #e9ecef;
              border-radius: 6px;
              margin: 15px 0;
            }
            .action-text {
              font-size: 15px;
              color: #25292E;
              margin: 32px 0 24px;
              text-align: center;
              font-weight: 500;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              background: #047DD5;
              color: #ffffff !important;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 15px;
              text-align: center;
              box-shadow: 0 2px 8px rgba(4, 125, 213, 0.3);
              margin: 0 auto;
              display: block;
              width: fit-content;
              letter-spacing: 0.3px;
              border: none;
            }
            .button:hover {
              background: #1665C0;
              box-shadow: 0 4px 12px rgba(4, 125, 213, 0.4);
            }
            .footer {
              background: #f8f9fa;
              padding: 25px 30px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer-text {
              font-size: 12px;
              color: #999;
              line-height: 1.6;
            }
            .footer-link {
              color: #047DD5;
              text-decoration: none;
            }
            @media only screen and (max-width: 600px) {
              body { padding: 10px; }
              .content { padding: 30px 20px; }
              .header { padding: 30px 20px; }
              .header-title { font-size: 24px; }
              .price-highlight { font-size: 28px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo-container">
                <img src="${this.logoBase64 ? `data:image/png;base64,${this.logoBase64}` : this.logoUrl}" alt="exStrat Logo" width="200" height="auto" style="width: 200px; height: auto; max-width: 100%; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" class="logo" />
              </div>
              <h1 class="header-title">TP${tpOrder} Reached</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello ${userName},</p>
              <p class="message">
                Your target price <strong>TP${tpOrder}</strong> has been reached for 
                <span class="token-symbol">${tokenSymbol}</span>!
              </p>
              
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Token</span>
                  <span class="info-value">${tokenSymbol}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Target Price (TP${tpOrder})</span>
                  <span class="info-value">$${targetPrice.toFixed(2)}</span>
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                  <div class="price-highlight">$${currentPrice.toFixed(2)}</div>
                  <div style="text-align: center; color: #666; font-size: 13px; margin-top: 8px; font-weight: 500;">Current Price</div>
                </div>
              </div>

              <p class="action-text">Time to execute your profit-taking strategy!</p>
              
              <a href="https://app.exstrat.com/prevision" class="button">View Forecast</a>
            </div>
            <div class="footer">
              <p class="footer-text">
                This is an automated alert from <strong>exStrat</strong>.<br>
                You can manage your alerts in your <a href="https://app.exstrat.com/configuration" class="footer-link">account settings</a>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(data: {
    to: string;
    resetUrl: string;
  }): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured, skipping email');
      return;
    }

    const { to, resetUrl } = data;

    try {
      const subject = 'Reset your exStrat password';
      const html = this.generatePasswordResetEmail({ resetUrl });

      this.logger.log(`Attempting to send password reset email to ${to} from ${this.fromEmail}`);
      
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      const emailId = result.data?.id || 'N/A';
      this.logger.log(`Password reset email sent successfully to ${to}. Resend ID: ${emailId}`);
      this.logger.debug(`Resend response:`, JSON.stringify(result, null, 2));
    } catch (error: any) {
      this.logger.error(`Error sending password reset email to ${to}:`, error);
      this.logger.error(`Error details:`, {
        message: error?.message,
        name: error?.name,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw error;
    }
  }

  /**
   * Génère le HTML de l'email de réinitialisation de mot de passe
   */
  private generatePasswordResetEmail(data: { resetUrl: string }): string {
    const { resetUrl } = data;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - exStrat</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #25292E;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #047DD5 0%, #1665C0 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo-container {
              margin-bottom: 25px;
              text-align: center;
            }
            .logo {
              width: 200px;
              height: auto;
              max-width: 100%;
              display: block;
              margin: 0 auto;
            }
            .header-title {
              color: #ffffff;
              font-size: 24px;
              font-weight: 600;
              margin: 0;
              letter-spacing: -0.3px;
            }
            .content {
              padding: 40px 35px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 17px;
              color: #25292E;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .message {
              font-size: 15px;
              color: #666;
              margin-bottom: 28px;
              line-height: 1.7;
            }
            .info-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
              border-left: 4px solid #047DD5;
              padding: 25px;
              margin: 30px 0;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            .info-text {
              font-size: 14px;
              color: #666;
              line-height: 1.8;
            }
            .action-text {
              font-size: 15px;
              color: #25292E;
              margin: 32px 0 24px;
              text-align: center;
              font-weight: 500;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              background: #047DD5;
              color: #ffffff !important;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 15px;
              text-align: center;
              box-shadow: 0 2px 8px rgba(4, 125, 213, 0.3);
              margin: 0 auto;
              display: block;
              width: fit-content;
              letter-spacing: 0.3px;
              border: none;
            }
            .button:hover {
              background: #1665C0;
              box-shadow: 0 4px 12px rgba(4, 125, 213, 0.4);
            }
            .warning-text {
              font-size: 14px;
              color: #999;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              line-height: 1.6;
            }
            .footer {
              background: #f8f9fa;
              padding: 25px 30px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer-text {
              font-size: 12px;
              color: #999;
              line-height: 1.6;
            }
            .footer-link {
              color: #047DD5;
              text-decoration: none;
            }
            @media only screen and (max-width: 600px) {
              body { padding: 10px; }
              .content { padding: 30px 20px; }
              .header { padding: 30px 20px; }
              .header-title { font-size: 24px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo-container">
                <img src="${this.logoBase64 ? `data:image/png;base64,${this.logoBase64}` : this.logoUrl}" alt="exStrat Logo" width="200" height="auto" style="width: 200px; height: auto; max-width: 100%; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" class="logo" />
              </div>
              <h1 class="header-title">Password Reset</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello,</p>
              <p class="message">
                You have requested to reset your password for your exStrat account.
                Click the button below to create a new password.
              </p>
              
              <div class="info-card">
                <p class="info-text">
                  <strong>Important:</strong> This link is valid for 1 hour only.
                  If you did not request this reset, please ignore this email.
                </p>
              </div>

              <p class="action-text">Click the button to reset your password</p>
              
              <a href="${resetUrl}" class="button">Reset my password</a>

              <p class="warning-text">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #047DD5; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p class="footer-text">
                This email was automatically sent by <strong>exStrat</strong>.<br>
                If you did not request this reset, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Envoie un email de vérification d'email
   */
  async sendVerificationEmail(data: {
    to: string;
    verificationUrl: string;
  }): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured, skipping email');
      return;
    }

    const { to, verificationUrl } = data;

    try {
      const subject = 'Verify your email address - exStrat';
      const html = this.generateVerificationEmail({ verificationUrl });

      this.logger.log(`Attempting to send verification email to ${to} from ${this.fromEmail}`);
      
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      const emailId = result.data?.id || 'N/A';
      this.logger.log(`Verification email sent successfully to ${to}. Resend ID: ${emailId}`);
      this.logger.debug(`Resend response:`, JSON.stringify(result, null, 2));
    } catch (error: any) {
      this.logger.error(`Error sending verification email to ${to}:`, error);
      this.logger.error(`Error details:`, {
        message: error?.message,
        name: error?.name,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw error;
    }
  }

  /**
   * Génère le HTML de l'email de vérification d'email
   */
  private generateVerificationEmail(data: { verificationUrl: string }): string {
    const { verificationUrl } = data;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email - exStrat</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #25292E;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #047DD5 0%, #1665C0 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo-container {
              margin-bottom: 25px;
              text-align: center;
            }
            .header-title {
              color: #ffffff;
              font-size: 24px;
              font-weight: 600;
              margin: 0;
              letter-spacing: -0.3px;
            }
            .content {
              padding: 40px 35px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 17px;
              color: #25292E;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .message {
              font-size: 15px;
              color: #666;
              margin-bottom: 28px;
              line-height: 1.7;
            }
            .info-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
              border-left: 4px solid #047DD5;
              padding: 25px;
              margin: 30px 0;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            .info-text {
              font-size: 14px;
              color: #666;
              line-height: 1.8;
            }
            .action-text {
              font-size: 15px;
              color: #25292E;
              margin: 32px 0 24px;
              text-align: center;
              font-weight: 500;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              background: #047DD5;
              color: #ffffff !important;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 15px;
              text-align: center;
              box-shadow: 0 2px 8px rgba(4, 125, 213, 0.3);
              margin: 0 auto;
              display: block;
              width: fit-content;
              letter-spacing: 0.3px;
              border: none;
            }
            .button:hover {
              background: #1665C0;
              box-shadow: 0 4px 12px rgba(4, 125, 213, 0.4);
            }
            .warning-text {
              font-size: 14px;
              color: #999;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              line-height: 1.6;
            }
            .footer {
              background: #f8f9fa;
              padding: 25px 30px;
              text-align: center;
              border-top: 1px solid #e9ecef;
            }
            .footer-text {
              font-size: 12px;
              color: #999;
              line-height: 1.6;
            }
            .footer-link {
              color: #047DD5;
              text-decoration: none;
            }
            @media only screen and (max-width: 600px) {
              body { padding: 10px; }
              .content { padding: 30px 20px; }
              .header { padding: 30px 20px; }
              .header-title { font-size: 24px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo-container">
                <img src="${this.logoBase64 ? `data:image/png;base64,${this.logoBase64}` : this.logoUrl}" alt="exStrat Logo" width="200" height="auto" style="width: 200px; height: auto; max-width: 100%; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" class="logo" />
              </div>
              <h1 class="header-title">Verify your email</h1>
            </div>
            <div class="content">
              <p class="greeting">Welcome to exStrat!</p>
              <p class="message">
                Thank you for signing up. To activate your account and start using exStrat,
                please verify your email address by clicking the button below.
                </p>

              <p class="action-text">Click the button to verify your email</p>
              
              <a href="${verificationUrl}" class="button">Verify my email</a>

              <p class="warning-text">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #047DD5; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p class="footer-text">
                This email was automatically sent by <strong>exStrat</strong>.<br>
                If you did not create an account, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Envoie un email de feedback utilisateur
   */
  async sendFeedbackEmail(data: {
    from: string;
    userName?: string;
    message: string;
    images?: MulterFile[];
  }): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured, skipping email');
      return;
    }

    const { from, userName, message, images = [] } = data;
    const to = 'contact@exstrat.io';

    try {
      const subject = `Feedback from ${userName || from} - exStrat`;
      const html = this.generateFeedbackEmail({ from, userName, message, images });

      this.logger.log(`Attempting to send feedback email from ${from} to ${to}${images.length > 0 ? ` with ${images.length} image(s)` : ''}`);
      
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        replyTo: from,
        subject,
        html,
      });

      const emailId = result.data?.id || 'N/A';
      this.logger.log(`Feedback email sent successfully from ${from} to ${to}. Resend ID: ${emailId}`);
      this.logger.debug(`Resend response:`, JSON.stringify(result, null, 2));
    } catch (error: any) {
      this.logger.error(`Error sending feedback email from ${from} to ${to}:`, error);
      this.logger.error(`Error details:`, {
        message: error?.message,
        name: error?.name,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      throw error;
    }
  }

  /**
   * Génère le HTML de l'email de feedback
   */
  private generateFeedbackEmail(data: { 
    from: string; 
    userName?: string; 
    message: string;
    images?: MulterFile[];
  }): string {
    const { from, userName, message, images = [] } = data;
    const displayName = userName || from;

    // Convert images to base64 data URLs
    const imageHtml = images.length > 0 ? images.map((file, index) => {
      const base64 = file.buffer.toString('base64');
      const mimeType = file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return `
              <div style="margin: 15px 0; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #666; font-size: 12px; font-weight: 600;">
                  ${file.originalname || `Image ${index + 1}`}
                </p>
                <img 
                  src="${dataUrl}" 
                  alt="${file.originalname || `Screenshot ${index + 1}`}"
                  style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #047DD5; box-shadow: 0 2px 8px rgba(4, 125, 213, 0.2);"
                />
              </div>
      `;
    }).join('') : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback from ${displayName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(4, 125, 213, 0.15);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #047DD5 0%, #1665C0 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">New Feedback</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #25292E; font-size: 18px; font-weight: 600;">Feedback from ${displayName}</h2>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                <strong style="color: #047DD5;">Email:</strong> ${from}
              </p>
              ${userName ? `
              <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
                <strong style="color: #047DD5;">Name:</strong> ${userName}
              </p>
              ` : ''}
              <div style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #e6f4fd 0%, #ffffff 100%); border-radius: 8px; border-left: 4px solid #047DD5; box-shadow: 0 2px 8px rgba(4, 125, 213, 0.1);">
                <p style="margin: 0; color: #25292E; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              ${images.length > 0 ? `
              <div style="margin: 20px 0; padding: 20px; background: #ffffff; border-radius: 8px; border: 2px solid #047DD5;">
                <h3 style="margin: 0 0 15px 0; color: #047DD5; font-size: 16px; font-weight: 600;">Attached Images (${images.length})</h3>
                ${imageHtml}
              </div>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; background: linear-gradient(135deg, #f8f9fa 0%, #e6f4fd 100%); border-radius: 0 0 12px 12px; border-top: 2px solid #047DD5;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                This feedback was sent from the exStrat application.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}

