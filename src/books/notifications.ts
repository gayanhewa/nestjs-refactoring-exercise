import { Injectable } from '@nestjs/common';

export interface Notifier {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSms(to: string, message: string): Promise<void>;
  sendPush(deviceToken: string, title: string, body: string): Promise<void>;
}

@Injectable()
export class EmailNotifier implements Notifier {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`[email] -> ${to} | ${subject} | ${body}`);
  }

  async sendSms(): Promise<void> {
    throw new Error('EmailNotifier does not support SMS');
  }

  async sendPush(): Promise<void> {
    throw new Error('EmailNotifier does not support push');
  }
}

@Injectable()
export class SmsNotifier implements Notifier {
  async sendEmail(): Promise<void> {
    throw new Error('SmsNotifier does not support email');
  }

  async sendSms(to: string, message: string): Promise<void> {
    console.log(`[sms] -> ${to} | ${message}`);
  }

  async sendPush(): Promise<void> {
    throw new Error('SmsNotifier does not support push');
  }
}
