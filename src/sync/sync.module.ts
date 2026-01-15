import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { LeadModule } from '../lead/lead.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
class SyncScheduler {
    private readonly logger = new Logger(SyncScheduler.name);

    constructor(private readonly syncService: SyncService) { }

    @Cron(CronExpression.EVERY_6_HOURS)
    async handleCron() {
        this.logger.log('Executing scheduled lead sync...');
        await this.syncService.syncLeadsFromRandomUser();
    }
}

@Module({
    imports: [LeadModule, ScheduleModule.forRoot()],
    controllers: [SyncController],
    providers: [SyncService, SyncScheduler],
})
export class SyncModule { }
