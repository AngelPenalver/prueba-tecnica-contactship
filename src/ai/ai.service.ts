import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lead } from '../lead/entities/lead.entity';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    }

    async generateSummary(lead: Lead): Promise<{ summary: string; next_action: string }> {
        const prompt = `
Eres un asistente de ventas. Basándote en la siguiente información del lead, genera:
1. Un resumen breve del lead
2. Una acción sugerida para el equipo de ventas

Información del Lead:
- Nombre: ${lead.name}
- Email: ${lead.email}
- Teléfono: ${lead.phone || 'N/A'}
- Empresa: ${lead.company || 'N/A'}

IMPORTANTE: Responde SOLO con JSON válido en este formato exacto:
{
  "summary": "resumen breve aquí",
  "next_action": "acción sugerida aquí"
}

No incluyas ningún otro texto, markdown, ni bloques de código. Solo el objeto JSON.
Asegúrate de que la respuesta esté completamente en español.
`;

        try {
            this.logger.log(`Generating AI summary for lead ${lead.id}`);
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response
            const parsed = JSON.parse(text.trim());

            if (!parsed.summary || !parsed.next_action) {
                throw new Error('Invalid AI response format');
            }

            this.logger.log(`AI summary generated successfully for lead ${lead.id}`);
            return {
                summary: parsed.summary,
                next_action: parsed.next_action,
            };
        } catch (error) {
            this.logger.error(`Error generating AI summary: ${error.message}`);
            // Fallback
            return {
                summary: `Lead: ${lead.name} de ${lead.company || 'Empresa desconocida'}`,
                next_action: 'Contactar al lead para agendar una llamada inicial',
            };
        }
    }
}
