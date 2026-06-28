import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { OpenLibrarySdk } from './vendor/open-library.sdk';
import { WarehouseHttpClient } from './vendor/http-client';
import { EmailNotifier } from './notifications';
import { PricingService } from './pricing/pricing.service';

@Injectable()
export class BooksService {
  private readonly openLibrary = new OpenLibrarySdk(
    process.env.OPEN_LIBRARY_API_KEY ?? '',
  );
  private readonly warehouse = new WarehouseHttpClient();

  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly pricing: PricingService,
    private readonly email: EmailNotifier,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const start = Date.now();

    let title = createBookDto.title;
    let author = createBookDto.author;

    // Enrich missing fields from the metadata provider.
    if (!title || !author) {
      const meta = await this.openLibrary.fetchByIsbn(
        String(createBookDto.isbn),
      );
      title = title || meta.title;
      author = author || meta.authors.join(', ');
    }

    const basePrice = process.env.DEFAULT_BOOK_PRICE
      ? parseFloat(process.env.DEFAULT_BOOK_PRICE)
      : 9.99;
    const country = process.env.DEFAULT_COUNTRY ?? 'US';
    const price = this.pricing.calculate(basePrice, country, 'standard');

    const book = this.booksRepository.create({
      title,
      author,
      isbn: createBookDto.isbn,
      price,
    });
    const saved = await this.booksRepository.save(book);

    if (process.env.NOTIFICATIONS_ENABLED === 'true') {
      await this.email.sendEmail(
        process.env.ADMIN_EMAIL ?? 'admin@example.com',
        'New book added',
        `${saved.title} by ${saved.author} ($${saved.price})`,
      );
    }

    console.log(`[metrics] create took ${Date.now() - start}ms`);
    return saved;
  }

  async purchase(id: number, quantity: number): Promise<Book> {
    const start = Date.now();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const book = await queryRunner.manager.findOneBy(Book, { id });
      if (!book) {
        throw new NotFoundException(`Book #${id} not found`);
      }

      // Reserve stock in the external warehouse — inside the DB transaction.
      const reservation = await this.warehouse.reserveStock({
        isbn: String(book.isbn),
        quantity,
      });
      console.log(`[purchase] reservation ${reservation.reservationId}`);

      book.price = this.pricing.calculate(Number(book.price), 'US', 'premium');
      await queryRunner.manager.save(book);

      await queryRunner.commitTransaction();

      if (process.env.NOTIFICATIONS_ENABLED === 'true') {
        await this.email.sendEmail(
          process.env.ADMIN_EMAIL ?? 'admin@example.com',
          'Book purchased',
          `${quantity}x ${book.title}`,
        );
      }

      console.log(`[metrics] purchase took ${Date.now() - start}ms`);
      return book;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll(): Promise<Book[]> {
    return this.booksRepository.find();
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.booksRepository.findOneBy({ id });
    if (!book) {
      throw new NotFoundException(`Book #${id} not found`);
    }
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    Object.assign(book, updateBookDto);
    return this.booksRepository.save(book);
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    await this.booksRepository.remove(book);
  }
}
