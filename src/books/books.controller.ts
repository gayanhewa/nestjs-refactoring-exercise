import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { EmailNotifier } from './notifications';

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly email: EmailNotifier,
  ) {}

  @Post()
  async create(@Body() createBookDto: CreateBookDto) {
    // Validate the payload inline.
    if (!createBookDto.isbn) {
      throw new BadRequestException('isbn is required');
    }
    const isbnStr = String(createBookDto.isbn).replace(/[-\s]/g, '');
    if (isbnStr.length !== 13 || !/^\d+$/.test(isbnStr)) {
      throw new BadRequestException('isbn must be 13 digits');
    }
    if (createBookDto.title && createBookDto.title.length > 255) {
      throw new BadRequestException('title too long');
    }

    // Normalize fields.
    const normalized = {
      ...createBookDto,
      isbn: parseInt(isbnStr, 10),
      title: createBookDto.title?.trim(),
      author: createBookDto.author?.trim(),
    };

    // Compute a dedupe hash for logging/audit.
    const hash = createHash('sha256')
      .update(isbnStr)
      .digest('hex')
      .slice(0, 12);
    console.log(`[audit] create book request hash=${hash}`);

    const book = await this.booksService.create(normalized);

    // Fire a confirmation notification straight from the controller.
    if (process.env.NOTIFICATIONS_ENABLED === 'true') {
      await this.email.sendEmail(
        process.env.ADMIN_EMAIL ?? 'admin@example.com',
        'Book created (controller)',
        `id=${book.id} hash=${hash}`,
      );
    }

    return book;
  }

  @Post(':id/purchase')
  purchase(@Param('id') id: string, @Body() body: { quantity?: number }) {
    const qty = body.quantity ?? 1;
    if (qty < 1) {
      throw new BadRequestException('quantity must be >= 1');
    }
    return this.booksService.purchase(+id, qty);
  }

  @Get()
  findAll() {
    return this.booksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(+id, updateBookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.booksService.remove(+id);
  }
}
