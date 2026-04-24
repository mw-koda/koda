import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InternsService, type InternFilters } from './interns.service';
import { CreateInternDto } from './dto/create-intern.dto';
import { UpdateInternDto } from './dto/update-intern.dto';

@Controller('interns')
@ApiTags('Interns')
export class InternsController {
  constructor(private readonly service: InternsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an intern profile' })
  @ApiBody({ type: CreateInternDto })
  create(@Body() dto: CreateInternDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List interns' })
  @ApiQuery({ name: 'batchId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query() query: InternFilters) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an intern by id' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an intern' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateInternDto })
  update(@Param('id') id: string, @Body() dto: UpdateInternDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an intern' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get intern profile details' })
  @ApiParam({ name: 'id', type: String })
  getProfile(@Param('id') id: string) {
    return this.service.getProfile(id);
  }
}
