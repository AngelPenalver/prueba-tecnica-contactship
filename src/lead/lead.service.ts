import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class LeadService {
  constructor(@InjectRepository(Lead) private readonly leadRepository: Repository<Lead>, @InjectQueue('leads-queue') private readonly leadsQueue: Queue) { }

  async create(createLeadDto: CreateLeadDto) {
    const lead = await this.findLeadByEmail(createLeadDto.email);
    if (lead) {
      throw new ConflictException('Lead already exists');
    }
    const newLead = this.leadRepository.create(createLeadDto)
    const savedLead = await this.leadRepository.save(newLead);
    await this.leadsQueue.add('process-lead-ai', {
      leadId: savedLead.id,
    });
    return savedLead;
  }

  async findLeadByEmail(email: string) {
    return this.leadRepository.findOne({ where: { email } });
  }
}
