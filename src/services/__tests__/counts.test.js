import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
let capturedCalls = [];

vi.mock('../../lib/supabase', () => {
  const supabase = {
    from: (table) => {
      return {
        select: (cols, options) => {
          capturedCalls.push({ table, cols, options });
          const chain = {
            _eq: null,
            _limit: null,
            eq: (col, val) => {
              chain._eq = { col, val };
              return chain;
            },
            limit: (n) => {
              chain._limit = n;
              // emulate supabase response for count queries
              return Promise.resolve({ count: 123, error: null });
            }
          };
          return chain;
        },
      };
    }
  };
  return { supabase };
});

import { salesService } from '../salesService';
import { campaignService } from '../campaignService';
import { inventoryService } from '../inventoryService';

beforeEach(() => {
  capturedCalls = [];
});

describe('Count queries avoid HEAD aborts', () => {
  it('salesService.getSalesCount uses GET count without head:true', async () => {
    const { count, error } = await salesService.getSalesCount();
    expect(error).toBeNull();
    expect(count).toBe(123);

    // Verify the select options do not include head:true
    const call = capturedCalls.find(c => c.table === 'ventas');
    expect(call).toBeDefined();
    expect(call.cols).toBe('id');
    expect(call.options).toMatchObject({ count: 'exact' });
    expect(call.options.head).toBeUndefined();
  });

  it('campaignService.getCampaignMembersCount uses GET count and filters by campana_id', async () => {
    const testCampaignId = 'test-campaign-id';
    const { count, error } = await campaignService.getCampaignMembersCount(testCampaignId);
    expect(error).toBeNull();
    expect(count).toBe(123);

    const call = capturedCalls.find(c => c.table === 'campana_miembros');
    expect(call).toBeDefined();
    expect(call.cols).toBe('usuario_id');
    expect(call.options).toMatchObject({ count: 'exact' });
    expect(call.options.head).toBeUndefined();
  });

  it('inventoryService.getProductsCount uses GET count without head:true', async () => {
    const { count, error } = await inventoryService.getProductsCount();
    expect(error).toBeNull();
    expect(count).toBe(123);

    const call = capturedCalls.find(c => c.table === 'armazones');
    expect(call).toBeDefined();
    expect(call.cols).toBe('id');
    expect(call.options).toMatchObject({ count: 'exact' });
    expect(call.options.head).toBeUndefined();
  });
});