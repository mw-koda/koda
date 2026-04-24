import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Patch,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserRecord } from '../auth/auth.service';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  @Roles(Role.INTERN, Role.ADMIN)
  async submit(@Body() dto: CreateReportDto, @CurrentUser() user: UserRecord) {
    if (user.role === Role.INTERN && user.intern_id !== dto.intern_id) {
      throw new ForbiddenException('You can only submit reports for yourself.');
    }
    return this.service.submit(dto);
  }

  @Get('intern/:internId')
  @Roles(Role.INTERN, Role.COORDINATOR, Role.TEAM_LEAD, Role.ADMIN)
  async getByIntern(
    @Param('internId') internId: string,
    @Query() query: any,
    @CurrentUser() user: UserRecord,
  ) {
    if (user.role === Role.INTERN && user.intern_id !== internId) {
      throw new ForbiddenException('You can only view your own reports.');
    }
    return this.service.findByIntern(internId, query);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: UserRecord) {
    const report = await this.service.findOne(id);
    if (user.role === Role.INTERN && user.intern_id !== report.intern_id) {
      throw new ForbiddenException('You can only view your own reports.');
    }
    return report;
  }

  @Patch(':id/status')
  @Roles(Role.COORDINATOR, Role.TEAM_LEAD, Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReportStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}
