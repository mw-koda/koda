import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import {
  ActivityDto,
  DashboardStatsDto,
  GetDashboardQueryDto,
  PerformanceTrendDto,
} from './dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEAM_LEAD)
@ApiTags('Dashboard')
@ApiBearerAuth('bearer-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats' })
  async getStats(
    @Query() query: GetDashboardQueryDto,
  ): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(query);
  }

  @Get('performance-trend')
  @ApiOperation({ summary: 'Get dashboard performance trend' })
  async getPerformanceTrend(
    @Query() query: GetDashboardQueryDto,
  ): Promise<PerformanceTrendDto[]> {
    return this.dashboardService.getPerformanceTrend(query);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get dashboard activity feed' })
  async getActivity(
    @Query() query: GetDashboardQueryDto,
  ): Promise<ActivityDto[]> {
    return this.dashboardService.getActivity(query);
  }
}
