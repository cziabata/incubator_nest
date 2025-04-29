import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    await this.dataSource.query(`TRUNCATE TABLE posts CASCADE`);
    await this.dataSource.query(`TRUNCATE TABLE blogs CASCADE`);
    // await this.dataSource.query(`TRUNCATE TABLE comments CASCADE`);
    await this.dataSource.query(`TRUNCATE TABLE sessions CASCADE`);
    await this.dataSource.query(`TRUNCATE TABLE refresh_tokens_black_list CASCADE`);
    await this.dataSource.query(`TRUNCATE TABLE users CASCADE`);
  }
}
