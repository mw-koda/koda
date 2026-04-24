import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Patch,
  Body,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Controller('reports')
@ApiTags('Reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a report' })
  @ApiBody({ type: CreateReportDto })
  submit(@Body() dto: CreateReportDto) {
    return this.service.submit(dto);
  }

  @Get('intern/:internId')
  @ApiOperation({ summary: 'List reports for an intern' })
  @ApiParam({ name: 'internId', type: String })
  @ApiQuery({ name: 'query', required: false, type: Object })
  getByIntern(@Param('internId') internId: string, @Query() query: any) {
    return this.service.findByIntern(internId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report by id' })
  @ApiParam({ name: 'id', type: String })
  getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a report status' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateReportStatusDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReportStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}
