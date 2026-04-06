import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { AssignInternsDto } from './dto/assign-interns.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchesService.create(createBatchDto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.batchesService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBatchDto: UpdateBatchDto,
  ) {
    return this.batchesService.update(id, updateBatchDto);
  }

  @Post(':id/interns')
  assignInterns(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignInternsDto: AssignInternsDto,
  ) {
    return this.batchesService.assignInterns(id, assignInternsDto);
  }
}