import { INestApplication, ValidationPipe } from '@nestjs/common';

import { ValidationError } from '@nestjs/common';
import { BadRequestDomainException } from '../core/exceptions/domain-exceptions';
import { UuidValidationTransformationPipe } from '../core/pipes/object-id-validation-transformation-pipe.service';

type ErrorResponse = { message: string; key: string };

const mapValidationErrorsToResponse = (errors: ValidationError[]): ErrorResponse[] => {
  const response: ErrorResponse[] = [];

  errors.forEach((error) => {
    if (!error?.constraints && error?.children?.length) {
      response.push(...mapValidationErrorsToResponse(error.children));
    } else if (error?.constraints) {
      const constrainKeys = Object.keys(error.constraints ?? {});
      constrainKeys.forEach((key) => {
        response.push({
          key: error.property,
          message: error.constraints && error.constraints[key]
            ? `${error.constraints[key]}; Received value: ${error?.value}`
            : 'Unknown validation error',
        });
      });
    }
  });

  return response;
};

export const pipesSetup = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const errorResponse = mapValidationErrorsToResponse(errors);
        return BadRequestDomainException.create(JSON.stringify(errorResponse));
      },
    }),
    new UuidValidationTransformationPipe(),
  );
};
