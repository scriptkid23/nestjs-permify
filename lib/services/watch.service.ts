import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable()
export class WatchService {
  constructor(private readonly httpService: HttpService) {}

  watchSchema(tenantId: string): Observable<any> {
    // Using the stream endpoint for watching schema changes
    const url = `/v1/tenants/${tenantId}/watch/schema`;
    return this.httpService.get(url, { 
      responseType: 'stream',
      headers: {
        'Accept': 'text/event-stream'
      } 
    }).pipe(
      // Process the streaming response here
      // In real implementation, you would use RxJS operators to parse the SSE stream
    );
  }
  
  watchRelationships(tenantId: string): Observable<any> {
    // Using the stream endpoint for watching relationship changes
    const url = `/v1/tenants/${tenantId}/watch/relationships`;
    return this.httpService.get(url, { 
      responseType: 'stream',
      headers: {
        'Accept': 'text/event-stream'
      } 
    }).pipe(
      // Process the streaming response here
      // In real implementation, you would use RxJS operators to parse the SSE stream
    );
  }
  
  // Method for testing connectivity to watch endpoints
  async checkWatchEndpoint(tenantId: string, entityType: string): Promise<boolean> {
    try {
      const url = `/v1/tenants/${tenantId}/watch/${entityType}/status`;
      const response = await firstValueFrom(this.httpService.get(url));
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
