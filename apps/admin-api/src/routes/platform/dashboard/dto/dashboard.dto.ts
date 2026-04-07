import { ApiProperty } from '@nestjs/swagger';

export class PlatformStatsDto {
  @ApiProperty({ description: 'Number of active tenants' })
  activeTenants!: number;

  @ApiProperty({ description: 'Total revenue across all tenants' })
  totalRevenue!: number;

  @ApiProperty({ description: 'Current platform health status' })
  systemHealth!: string;

  @ApiProperty({ description: 'Number of pending settlements' })
  pendingSettlements!: number;
}

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
