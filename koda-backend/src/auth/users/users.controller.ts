import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { UserRecord } from '../auth.service';
import { OnboardUserDto } from './dto/onboard-user.dto';
import { GetUsersQueryDto } from './dto/get-users.query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Users')
@ApiBearerAuth('bearer-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('onboard')
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  @ApiOperation({ summary: 'Create a user profile from a GitHub username' })
  @ApiBody({ type: OnboardUserDto })
  async onboardUser(@Body() dto: OnboardUserDto): Promise<UserRecord> {
    return this.usersService.onboardUser(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEAM_LEAD, Role.COORDINATOR)
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<UserRecord[]> {
    return this.usersService.getUsers(query);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.TEAM_LEAD)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserDto })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserRecord> {
    return this.usersService.updateUser(id, dto);
  }
}
