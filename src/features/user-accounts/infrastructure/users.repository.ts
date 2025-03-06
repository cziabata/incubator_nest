import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '../../../core/exceptions/domain-exceptions';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);

    if (!user) {
      throw NotFoundDomainException.create('user not found');
    }

    return user;
  }

  findByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login });
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email });
  }

  findByConfirmationCode(
    confirmationCode: string,
  ): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      confirmationCode,
    });
  }

  async loginIsExist(login: string): Promise<boolean> {
    return !!(await this.UserModel.countDocuments({ login }));
  }

  async emailIsExist(email: string): Promise<boolean> {
    return !!(await this.UserModel.countDocuments({ email }));
  }
}
