import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { AssignInternsDto } from './dto/assign-interns.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Controller('batches')
@ApiTags('Batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a batch' })
  @ApiBody({ type: CreateBatchDto })
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchesService.create(createBatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'List batches' })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search?: string) {
    return this.batchesService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a batch by id' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a batch' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateBatchDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBatchDto: UpdateBatchDto,
  ) {
    return this.batchesService.update(id, updateBatchDto);
  }

  @Post(':id/interns')
  @ApiOperation({ summary: 'Assign interns to a batch' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AssignInternsDto })
  assignInterns(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignInternsDto: AssignInternsDto,
  ) {
    return this.batchesService.assignInterns(id, assignInternsDto);
  }
}
