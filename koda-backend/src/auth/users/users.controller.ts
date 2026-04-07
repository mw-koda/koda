import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { UserRecord } from '../auth.service';

class OnboardUserDto {
  @IsNotEmpty()
  userId!: string;

  @IsEnum(Role)
  role!: Role;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('onboard')
  @Roles(Role.COORDINATOR) // Assuming COORDINATOR is admin
  async onboardUser(@Body() dto: OnboardUserDto): Promise<UserRecord> {
    return this.usersService.onboardUser(dto.userId, dto.role);
  }

  @Get()
  @Roles(Role.COORDINATOR)
  async getUsers(): Promise<UserRecord[]> {
    return this.usersService.getUsers();
  }
}
