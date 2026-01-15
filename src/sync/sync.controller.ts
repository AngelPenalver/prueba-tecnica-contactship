import { Controller, Post, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('sync')
@UseGuards(ApiKeyGuard)
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Post('leads')
    async syncLeads() {
        return this.syncService.syncLeadsFromRandomUser();
    }
}
