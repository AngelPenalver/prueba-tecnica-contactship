import { Injectable, Logger } from '@nestjs/common';
import { LeadService } from '../lead/lead.service';
import { CreateLeadDto } from '../lead/dto/create-lead.dto';

interface RandomUser {
    name: {
        first: string;
        last: string;
    };
    email: string;
    phone: string;
    location: {
        street: {
            number: number;
            name: string;
        };
        city: string;
        state: string;
        country: string;
    };
}

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(private readonly leadService: LeadService) { }

    async syncLeadsFromRandomUser(): Promise<{ imported: number; skipped: number }> {
        this.logger.log('Starting Random User API synchronization...');

        try {
            const response = await fetch('https://randomuser.me/api/?results=10');
            const data = await response.json();

            const users: RandomUser[] = data.results;

            let imported = 0;
            let skipped = 0;

            for (const user of users) {
                const leadDto: CreateLeadDto = {
                    name: `${user.name.first} ${user.name.last}`,
                    email: user.email,
                    phone: user.phone,
                    company: `${user.location.city} Corp`, // Mock company name
                };

                try {
                    // LeadService already checks for duplicates by email
                    await this.leadService.create(leadDto);
                    imported++;
                    this.logger.log(`Imported lead: ${leadDto.email}`);
                } catch (error) {
                    // If lead already exists, skip it
                    if (error.message?.includes('already exists')) {
                        skipped++;
                        this.logger.debug(`Skipped duplicate lead: ${leadDto.email}`);
                    } else {
                        this.logger.error(`Error importing lead ${leadDto.email}: ${error.message}`);
                    }
                }
            }

            this.logger.log(`Sync completed: ${imported} imported, ${skipped} skipped`);
            return { imported, skipped };
        } catch (error) {
            this.logger.error(`Sync failed: ${error.message}`);
            throw error;
        }
    }
}
