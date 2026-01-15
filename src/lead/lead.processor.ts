import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Processor('leads-queue')
export class LeadProcessor extends WorkerHost {
    private readonly logger = new Logger(LeadProcessor.name);

    constructor(
        @InjectRepository(Lead)
        private readonly leadRepository: Repository<Lead>,
        private readonly aiService: AiService,
    ) {
        super();
    }

    async process(job: Job<{ leadId: string }>): Promise<any> {
        const { leadId } = job.data;
        this.logger.log(`Initiating AI process for Lead: ${leadId}`);

        const lead = await this.leadRepository.findOneBy({ id: leadId });

        if (!lead) {
            this.logger.error(`Lead ${leadId} not found.`);
            return;
        }

        const { summary, next_action } = await this.aiService.generateSummary(lead);

        lead.ai_summary = summary;
        lead.ai_next_action = next_action;

        await this.leadRepository.save(lead);

        this.logger.log(`Lead ${leadId} enriched successfully.`);
    }
}