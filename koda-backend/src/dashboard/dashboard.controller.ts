import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import {
  ActivityDto,
  DashboardStatsDto,
  GetDashboardQueryDto,
} from './dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEAM_LEAD)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @Query() query: GetDashboardQueryDto,
  ): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(query);
  }

  @Get('activity')
  async getActivity(
    @Query() query: GetDashboardQueryDto,
  ): Promise<ActivityDto[]> {
    return this.dashboardService.getActivity(query);
  }
}
