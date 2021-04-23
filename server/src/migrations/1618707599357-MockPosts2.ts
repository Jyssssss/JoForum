import { MigrationInterface, QueryRunner } from "typeorm";

export class MockPosts21618707599357 implements MigrationInterface {
  public async up(_: QueryRunner): Promise<void> {}

  public async down(_: QueryRunner): Promise<void> {}
}
