export class CreateSessionDomainDto {
  user_id: string;
  device_id: string;
  iat: string;
  device_name: string;
  ip: string;
  exp: Date;
}
