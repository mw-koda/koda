import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RepositoriesService } from './repositories.service';
import { Repository } from './repository.entity';

@Controller('repositories')
@ApiTags('Repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List repositories' })
  findAll(): Promise<Repository[]> {
    return this.repositoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a repository by id' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string): Promise<Repository | null> {
    return this.repositoriesService.findOne(id);
  }
}
