import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), BullModule.registerQueue({
    name: 'leads-queue',
  })],
  controllers: [LeadController],
  providers: [LeadService],
})
export class LeadModule { }
