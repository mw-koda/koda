import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import type { UserRecord } from '../auth/auth.service';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Attendance')
@ApiBearerAuth('bearer-auth')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('time-in')
  @Roles(Role.INTERN)
  @ApiOperation({ summary: 'Time in the authenticated intern' })
  async timeIn(@CurrentUser() user: UserRecord) {
    return this.attendanceService.timeInForUser(user.id);
  }

  @Post('time-out')
  @Roles(Role.INTERN)
  @ApiOperation({ summary: 'Time out the authenticated intern' })
  async timeOut(@CurrentUser() user: UserRecord) {
    return this.attendanceService.timeOutForUser(user.id);
  }

  @Get(':internId')
  @Roles(Role.COORDINATOR, Role.TEAM_LEAD)
  @ApiOperation({ summary: 'Get attendance logs for an intern' })
  @ApiParam({ name: 'internId', type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getInternAttendance(
    @Param('internId', ParseUUIDPipe) internId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (from && Number.isNaN(new Date(from).getTime())) {
      throw new BadRequestException('from must be a valid date/time.');
    }
    if (to && Number.isNaN(new Date(to).getTime())) {
      throw new BadRequestException('to must be a valid date/time.');
    }

    return this.attendanceService.getAttendanceByIntern(internId, { from, to });
  }
}
