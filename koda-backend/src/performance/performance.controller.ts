import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { PerformanceService } from './performance.service';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  create(@Body() createPerformanceDto: CreatePerformanceDto) {
    return this.performanceService.create(createPerformanceDto);
  }

  @Get(':internId')
  findByIntern(@Param('internId', ParseUUIDPipe) internId: string) {
    return this.performanceService.findByIntern(internId);
  }

  @Get()
  getTeamPerformance(
    @Query('teamId', ParseUUIDPipe) teamId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('bucket') bucket?: 'week' | 'month',
  ) {
    return this.performanceService.getTeamPerformance({
      teamId,
      from,
      to,
      bucket,
    });
  }
}
