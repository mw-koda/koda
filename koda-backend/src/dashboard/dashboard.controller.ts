import { Controller, Get, Query } from '@nestjs/common';
import {
  ActivityDto,
  DashboardStatsDto,
  GetDashboardQueryDto,
  PerformanceTrendDto,
} from './dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @Query() query: GetDashboardQueryDto,
  ): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(query);
  }

  @Get('performance-trend')
  async getPerformanceTrend(
    @Query() query: GetDashboardQueryDto,
  ): Promise<PerformanceTrendDto[]> {
    return this.dashboardService.getPerformanceTrend(query);
  }

  @Get('activity')
  async getActivity(
    @Query() query: GetDashboardQueryDto,
  ): Promise<ActivityDto[]> {
    return this.dashboardService.getActivity(query);
  }
}
