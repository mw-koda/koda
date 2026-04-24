import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { InternsService, type InternFilters } from './interns.service';
import { CreateInternDto } from './dto/create-intern.dto';
import { UpdateInternDto } from './dto/update-intern.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import type { UserRecord } from '../auth/auth.service';

@Controller('interns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternsController {
  constructor(private readonly service: InternsService) {}

  @Post('join')
  join(
    @CurrentUser() user: UserRecord,
    @Body('joinCode') joinCode: string,
    @Body('school') school?: string,
  ) {
    return this.service.join(user.id, joinCode, school);
  }

  @Post()
  @Roles(Role.ADMIN, Role.COORDINATOR)
  create(@Body() dto: CreateInternDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.TEAM_LEAD, Role.INTERN)
  async findAll(
    @Query() query: InternFilters,
    @CurrentUser() user: UserRecord,
  ) {
    // If the user is an intern, enforce filtering by their own batch
    if (user.role === Role.INTERN) {
      if (!user.batch_id) {
        return []; // Intern not in a batch yet
      }

      // Override or enforce batchId filter to their own batch
      query.batchId = user.batch_id;
    }

    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserRecord) {
    // Interns can only view their own record
    if (user.role === Role.INTERN && user.intern_id !== id) {
      throw new ForbiddenException('You can only view your own intern record.');
    }
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.TEAM_LEAD)
  update(@Param('id') id: string, @Body() dto: UpdateInternDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/profile')
  async getProfile(@Param('id') id: string, @CurrentUser() user: UserRecord) {
    // Interns can only view their own profile
    if (user.role === Role.INTERN && user.intern_id !== id) {
      throw new ForbiddenException('You can only view your own profile.');
    }
    return this.service.getProfile(id);
  }
}
