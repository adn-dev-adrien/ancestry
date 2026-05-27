import { HttpException, HttpStatus } from '@nestjs/common';

export type BusinessRuleCode =
  | 'RELATIONSHIP_CYCLE'
  | 'DUPLICATE_RELATIONSHIP'
  | 'CROSS_TREE_REFERENCE'
  | 'MIXED_RELATIONSHIP_PAIR'
  | 'SELF_RELATIONSHIP'
  | 'INVALID_DATE_RANGE';

export class BusinessRuleException extends HttpException {
  constructor(
    public readonly code: BusinessRuleCode,
    message: string,
  ) {
    super({ statusCode: HttpStatus.CONFLICT, message, code }, HttpStatus.CONFLICT);
  }
}
