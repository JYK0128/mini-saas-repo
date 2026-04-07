import { ApiProperty } from '@nestjs/swagger';

export class ServiceStatsDto {
  @ApiProperty({ description: 'Total sales for the service' })
  totalSales!: number;

  @ApiProperty({ description: 'Number of active staff members' })
  activeStaff!: number;

  @ApiProperty({ description: 'Current platform usage metrics' })
  platformUsage!: number;

  @ApiProperty({ description: 'Current subscription plan name' })
  currentPlan!: string;
}

export class PlatformUsageDto {
  @ApiProperty()
  apiCalls!: number;

  @ApiProperty()
  storageUsed!: number;

  @ApiProperty()
  lastCalculatedAt!: Date;
}
