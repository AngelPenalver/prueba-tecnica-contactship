import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('leads')
@UseGuards(ApiKeyGuard)
export class LeadController {
  constructor(private readonly leadService: LeadService) { }

  @Post()
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadService.create(createLeadDto);
  }

  @Get()
  findAll() {
    return this.leadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadService.findOne(id);
  }

  @Post(':id/summarize')
  summarize(@Param('id') id: string) {
    return this.leadService.summarize(id);
  }
}
