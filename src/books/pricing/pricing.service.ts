import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  calculate(basePrice: number, country: string, tier: string): number {
    let price = basePrice;

    switch (country) {
      case 'US':
        switch (tier) {
          case 'standard':
            price = basePrice * 1.0;
            break;
          case 'premium':
            price = basePrice * 1.15;
            break;
          case 'enterprise':
            price = basePrice * 1.3;
            break;
          default:
            price = basePrice;
        }
        price = price * 1.07; // sales tax
        break;
      case 'UK':
        switch (tier) {
          case 'standard':
            price = basePrice * 1.0;
            break;
          case 'premium':
            price = basePrice * 1.2;
            break;
          case 'enterprise':
            price = basePrice * 1.35;
            break;
          default:
            price = basePrice;
        }
        price = price * 1.2; // VAT
        break;
      case 'AU':
        switch (tier) {
          case 'standard':
            price = basePrice * 1.05;
            break;
          case 'premium':
            price = basePrice * 1.25;
            break;
          case 'enterprise':
            price = basePrice * 1.4;
            break;
          default:
            price = basePrice;
        }
        price = price * 1.1; // GST
        break;
      default:
        price = basePrice * 1.1;
    }

    return Math.round(price * 100) / 100;
  }
}
