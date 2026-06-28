import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'books' })
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ type: 'bigint' })
  isbn: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  price: number;
}
