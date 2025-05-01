import { PipeTransform, Injectable, ArgumentMetadata, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isUUID(value)) {
      throw new NotFoundException('Not found');
    }
    return value;
  }
} 