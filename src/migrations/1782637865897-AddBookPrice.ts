import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBookPrice1782637865897 implements MigrationInterface {
    name = 'AddBookPrice1782637865897'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "books" ADD "price" numeric(10,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "price"`);
    }

}
