import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseGameIdPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const parsedValue = parseInt(value, 10);
    
    if (isNaN(parsedValue) || !Number.isInteger(parsedValue) || parsedValue <= 0) {
      throw new BadRequestException('Invalid game ID format');
    }
    
    return parsedValue;
  }
} 