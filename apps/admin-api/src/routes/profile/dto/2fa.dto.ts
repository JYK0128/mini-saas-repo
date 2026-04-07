import { ApiProperty } from '@nestjs/swagger';

export class Setup2FAResponseDto {
  @ApiProperty({ description: '2FA 비밀키' })
  secret!: string;

  @ApiProperty({ description: 'QR 코드 URL' })
  url!: string;
}

export class Enable2FADto {
  @ApiProperty({ description: '2FA 비밀키' })
  secret!: string;

  @ApiProperty({ description: '2FA 토큰' })
  token!: string;
}
