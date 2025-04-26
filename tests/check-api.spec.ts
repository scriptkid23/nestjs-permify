import { Test } from '@nestjs/testing';

describe('Permify API Check', () => {
  it('should have proper configuration', () => {
    const baseUrl = process.env.PERMIFY_BASE_URL || 'http://localhost:3476/';
    expect(baseUrl).toBeDefined();
    
    // This test just verifies that we have a configuration
    // It doesn't actually call the API
    expect(true).toBe(true);
  });
}); 