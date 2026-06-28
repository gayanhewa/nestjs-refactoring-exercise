import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book } from './entities/book.entity';
import { EmailNotifier, SmsNotifier } from './notifications';
import { PricingService } from './pricing/pricing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book])],
  controllers: [BooksController],
  providers: [BooksService, PricingService, EmailNotifier, SmsNotifier],
})
export class BooksModule {}
