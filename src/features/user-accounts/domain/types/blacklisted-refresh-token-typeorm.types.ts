export interface CreateBlacklistedTokenTypeOrmDto {
  token: string;
}

export interface BlacklistedTokenViewData {
  id: number;
  token: string;
  created_at: Date;
} 