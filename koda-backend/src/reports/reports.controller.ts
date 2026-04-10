import {
  Controller, Post, Get, Param, Query, Patch, Body
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  submit(@Body() dto: CreateReportDto) {
    return this.service.submit(dto);
  }

  @Get('intern/:internId')
  getByIntern(@Param('internId') internId: string, @Query() query: any) {
    return this.service.findByIntern(internId, query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}