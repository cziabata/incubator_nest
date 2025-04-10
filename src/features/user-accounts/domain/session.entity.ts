import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { CreateSessionDomainDto } from './dto/create-session.domain.dto';
import { UpdateSessionDomainDto } from './dto/update-session.domain.dto';

@Schema({ timestamps: true })
export class Session {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: String, required: true })
  user_id: string;

  @Prop({ type: String, required: true })
  device_id: string;

  @Prop({ type: String, required: true })
  iat: string;

  @Prop({ type: String, required: true })
  device_name: string;

  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: Date, nullable: true, default: null })
  exp: Date;

  get id() {
    return this._id.toString();
  }

  static createInstance(dto: CreateSessionDomainDto): SessionDocument {
    const session = new this();
    session.user_id = dto.user_id;
    session.device_id = dto.device_id;
    session.iat = dto.iat;
    session.device_name = dto.device_name;
    session.ip = dto.ip;
    session.exp = dto.exp;

    return session as SessionDocument;
  }

  update(dto: UpdateSessionDomainDto) {
    this.iat = dto.iat;
    this.exp = dto.exp;
  }
}

export const SessionSchema = SchemaFactory.createForClass(Session);

//регистрирует методы сущности в схеме
SessionSchema.loadClass(Session);

//Типизация документа
export type SessionDocument = HydratedDocument<Session>;

//Типизация модели + статические методы
export type SessionModelType = Model<SessionDocument> & typeof Session;
