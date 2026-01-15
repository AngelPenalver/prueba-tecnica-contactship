import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);
  constructor(
    @InjectRepository(Lead) private readonly leadRepository: Repository<Lead>,
    @InjectQueue('leads-queue') private readonly leadsQueue: Queue,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }
  /**
   * Create a new lead
   */
  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = await this.findLeadByEmail(createLeadDto.email);
    if (lead) {
      throw new ConflictException('Lead already exists');
    }
    const newLead = this.leadRepository.create(createLeadDto)
    const savedLead = await this.leadRepository.save(newLead);
    await this.leadsQueue.add('process-lead-ai', {
      leadId: savedLead.id,
    });
    this.logger.log(`Lead ${savedLead.id} created and added to queue`);
    return savedLead;
  }

  /**
   * Find all leads
   */
  async findAll(): Promise<Lead[]> {
    return this.leadRepository.find();
  }

  /**
   * Find a lead by id
   */
  async findOne(id: string): Promise<Lead> {
    const cacheKey = `lead:${id}`;
    const cachedLead = await this.cacheManager.get<Lead>(cacheKey);
    if (cachedLead) {
      this.logger.log(`Lead ${id} found in cache`);
      return cachedLead;
    }
    const lead = await this.leadRepository.findOne({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
    await this.cacheManager.set(cacheKey, lead);
    this.logger.log(`Lead ${id} found in database`);
    return lead;
  }

  /**
   * Find a lead by email
   */
  async findLeadByEmail(email: string): Promise<Lead | null> {
    return this.leadRepository.findOne({ where: { email } });
  }

  /**
   * Summarize lead using AI
   */
  async summarize(id: string) {
    const lead = await this.findOne(id);

    await this.leadsQueue.add('process-lead-ai', {
      leadId: lead.id,
    });

    this.logger.log(`Lead ${id} re-send to queue`);

    return { message: 'Lead reprocessed successfully' };
  }
}
