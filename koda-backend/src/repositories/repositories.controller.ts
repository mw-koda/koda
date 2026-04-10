import { Controller, Get, Param } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { Repository } from './repository.entity';

@Controller('repositories')
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
