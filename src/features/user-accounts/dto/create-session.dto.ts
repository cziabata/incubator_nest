export class CreateSessionDto {
  user_id: string;
  device_id: string;
  device_name: string;
  ip: string;
  iat: string;
  exp: Date;
}
