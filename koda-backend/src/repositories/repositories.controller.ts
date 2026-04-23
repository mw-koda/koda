import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { RepositoriesService } from './repositories.service';
import { Repository } from './repository.entity';

@Controller('repositories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEAM_LEAD)
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  findAll(): Promise<Repository[]> {
    return this.repositoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Repository | null> {
    return this.repositoriesService.findOne(id);
  }
}
