import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { UserRecord } from '../auth.service';
import { OnboardUserDto } from './dto/onboard-user.dto';
import { GetUsersQueryDto } from './dto/get-users.query.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('onboard')
  @Roles(Role.ADMIN)
  async onboardUser(@Body() dto: OnboardUserDto): Promise<UserRecord> {
    return this.usersService.onboardUser(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async getUsers(@Query() query: GetUsersQueryDto): Promise<UserRecord[]> {
    return this.usersService.getUsers(query);
  }
}
