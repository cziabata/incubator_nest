import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class ParseGameIdPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    console.log('ParseGameIdPipe: input value =', value);
    
    // Проверяем UUID с помощью регулярного выражения для большей надежности
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(value);
    
    console.log('ParseGameIdPipe: value =', value);
    console.log('ParseGameIdPipe: isValidUUID =', isValidUUID);
    console.log('ParseGameIdPipe: isUUID from class-validator =', isUUID(value));
    console.log('ParseGameIdPipe: value === 602afe92-7d97-4395-b1b9-6cf98b351bbe =', value === '602afe92-7d97-4395-b1b9-6cf98b351bbe');
    
    if (isValidUUID) {
      console.log('ParseGameIdPipe: Value is UUID, throwing NotFoundException');
      throw new NotFoundException('Game not found');
    }

    console.log('ParseGameIdPipe: Value is not UUID, trying to parse as number');
    const parsedValue = parseInt(value, 10);
    console.log('ParseGameIdPipe: Parsed value =', parsedValue);
    
    if (isNaN(parsedValue) || !Number.isInteger(parsedValue) || parsedValue <= 0) {
      console.log('ParseGameIdPipe: Invalid number format, throwing BadRequestException');
      throw new BadRequestException('Invalid game ID format');
    }
    
    console.log('ParseGameIdPipe: Returning valid number =', parsedValue);
    return parsedValue;
  }
}