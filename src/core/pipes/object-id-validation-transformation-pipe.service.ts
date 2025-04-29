import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

// Stub for compatibility, does nothing
@Injectable()
export class UuidValidationTransformationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): any {
    return value;
  }
}

@Injectable()
export class UuidValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    return value;
  }
}
