export class CreateUserDomainDto {
  login: string;
  email: string;
  passwordHash: string;
  expirationDate?: Date | null;
  confirmationCode?: string | null;
}
