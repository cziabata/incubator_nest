import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { CreateBlacklistedTokenDomainDto } from './dto/create-blacklisted-token.domain.dto';

@Schema({ timestamps: true })
export class BlacklistedToken {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: String, required: true })
  token: string;

  static createInstance(
    dto: CreateBlacklistedTokenDomainDto,
  ): BlacklistedTokenDocument {
    const user = new this();
    user.token = dto.token;

    return user as BlacklistedTokenDocument;
  }
}

export const BlacklistedTokenSchema =
  SchemaFactory.createForClass(BlacklistedToken);

//регистрирует методы сущности в схеме
BlacklistedTokenSchema.loadClass(BlacklistedToken);

//Типизация документа
export type BlacklistedTokenDocument = HydratedDocument<BlacklistedToken>;

//Типизация модели + статические методы
export type BlacklistedTokenModelType = Model<BlacklistedTokenDocument> &
  typeof BlacklistedToken;
