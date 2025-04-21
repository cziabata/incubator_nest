import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { CryptoService } from './crypto.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<string> {
    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    return this.usersRepository.createUser({
      login: dto.login,
      email: dto.email,
      passwordHash: passwordHash
    });
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
    return this.usersRepository.updateUser(id, { email: dto.email });
  }

  async deleteUser(id: string) {
    await this.usersRepository.deleteUserById(id);
  }
}
