import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  BlacklistedToken,
  BlacklistedTokenDocument,
  BlacklistedTokenModelType,
} from '../domain/blacklisted-token.entity';

@Injectable()
export class BlacklistedRefreshTokenRepository {
  constructor(
    @InjectModel(BlacklistedToken.name)
    private BlacklistedTokenModel: BlacklistedTokenModelType,
  ) {}

  async save(token: BlacklistedTokenDocument) {
    await token.save();
  }

  async doesExist(token: string): Promise<boolean> {
    const tokenDocument = await this.BlacklistedTokenModel.findOne({ token });
    return !!tokenDocument;
  }
}
