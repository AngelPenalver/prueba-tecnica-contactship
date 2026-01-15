import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { BullModule } from '@nestjs/bullmq';
import { LeadProcessor } from './lead.processor';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead]),
    BullModule.registerQueue({
      name: 'leads-queue',
    }),
    AiModule,
  ],
  controllers: [LeadController],
  providers: [LeadService, LeadProcessor],
  exports: [LeadService],
})
export class LeadModule { }
