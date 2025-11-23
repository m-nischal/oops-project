import { createMocks } from 'node-mocks-http';

// 1. Mock Mongoose Core
jest.mock('mongoose', () => {
  class MockSchema {
    constructor() {
      this.methods = {};
      this.statics = {};
    }
  }
  MockSchema.Types = { ObjectId: 'ObjectId', Mixed: 'Mixed' };
  return {
    connect: jest.fn(),
    connection: { readyState: 1 },
    Schema: MockSchema,
    model: jest.fn(),
    models: {},
    Types: { ObjectId: jest.fn() },
    isValidObjectId: jest.fn().mockReturnValue(true),
  };
});

// 2. Mock Dependencies
jest.mock('@/lib/dbConnect', () => jest.fn());

// Mock Product with the specific methods used in the API
jest.mock('@/models/Product', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  // Helper used in CatalogService
  computeTotalStockForPlainObject: jest.fn((p) => p.totalStock || 0),
}));

jest.mock('@/models/User', () => ({
  find: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue([]),
}));

// 3. Import Handler
import productsHandler from '@/pages/api/products/index';
import Product from '@/models/Product';

describe('/api/products API Integration', () => {
  
  test('GET returns a list of products with 200 OK', async () => {
    const mockProducts = [
      { name: 'Test Product A', price: 100, isPublished: true, totalStock: 10 },
      { name: 'Test Product B', price: 200, isPublished: true, totalStock: 5 },
    ];

    // Setup the chaining for Product.find().sort().skip().limit().lean().exec()
    const mockChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      // FIX: lean() must return 'this' (the chain object) so that .exec() can be called afterwards
      lean: jest.fn().mockReturnThis(), 
      exec: jest.fn().mockResolvedValue(mockProducts)
    };

    // We mock the return of find() to be the chain
    Product.find.mockReturnValue(mockChain);
    
    Product.countDocuments.mockResolvedValue(2);

    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '10' },
    });

    await productsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    
    expect(data.items).toHaveLength(2);
    expect(data.items[0].name).toBe('Test Product A');
  });
});