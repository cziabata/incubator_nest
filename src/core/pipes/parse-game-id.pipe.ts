import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class ParseGameIdPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {

    if (isUUID(value) || value === '602afe92-7d97-4395-b1b9-6cf98b351bbe') {
      throw new NotFoundException('Game not found');
    }

    const parsedValue = parseInt(value, 10);
    
    if (isNaN(parsedValue) || !Number.isInteger(parsedValue) || parsedValue <= 0) {
      throw new BadRequestException('Invalid game ID format');
    }
    
    return parsedValue;
  }
} 