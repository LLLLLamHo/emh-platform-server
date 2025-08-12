export interface UpdateGlobalConfigDto {
  value: string;
  description?: string;
}

export interface CreateGlobalConfigDto {
  key: string;
  value: string;
  description?: string;
}

export interface GlobalConfigResponseDto {
  id: number;
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
} 