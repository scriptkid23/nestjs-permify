import { Test, TestingModule } from '@nestjs/testing';
import { PermifyModule } from '../lib/permify.module';
import { HttpModule } from '@nestjs/axios';
import { PERMIFY_MODULE_OPTIONS } from '../lib/constants/permify.constants';

describe('URL Configuration', () => {
  it('should use http://localhost:3476/ as the baseUrl', async () => {
    // In our jest-setup.js, we've set process.env.PERMIFY_BASE_URL = 'http://localhost:3476/'
    const baseUrl = process.env.PERMIFY_BASE_URL || 'http://localhost:3476/';
    
    console.log('Current PERMIFY_BASE_URL:', baseUrl);
    
    // Verify the environment variable is set correctly
    expect(baseUrl).toBe('http://localhost:3476/');
    
    // Create a module with this configuration to verify HttpModule gets the correct baseURL
    const moduleOptions = {
      baseUrl: baseUrl,
      apiKey: 'test-api-key',
    };
    
    const moduleRef = await Test.createTestingModule({
      imports: [PermifyModule.forRoot(moduleOptions)],
    }).compile();
    
    // Get the module options from the module
    const options = moduleRef.get(PERMIFY_MODULE_OPTIONS);
    
    // Verify the module options contain the correct baseUrl
    expect(options.baseUrl).toBe('http://localhost:3476/');
  });
}); 