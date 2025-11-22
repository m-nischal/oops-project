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
    Schema: MockSchema,
    model: jest.fn(),
    models: {},
    Types: { ObjectId: jest.fn() },
  };
});

// 2. Mock the Product Model explicitly
jest.mock('@/models/Product', () => ({
  updateOne: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
}));

// 3. Import System Under Test
import InventoryService, { InsufficientStockError, InvalidParamsError } from '@/services/inventory';
import Product from '@/models/Product';

describe('InventoryService Unit Tests', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should throw InvalidParamsError if inputs are missing', async () => {
    await expect(InventoryService.decreaseStock(null, null, 5))
      .rejects
      .toThrow(InvalidParamsError);
  });

  test('should return true when stock is successfully decreased', async () => {
    // Setup mocks
    Product.updateOne.mockResolvedValue({ modifiedCount: 1, nModified: 1 });
    
    Product.findOne.mockReturnValue({
      session: () => ({
        lean: () => Promise.resolve({ sizes: [{ stock: 10 }] })
      })
    });

    const result = await InventoryService.decreaseStock('prod_123', 'M', 1);
    expect(result).toBe(true);
  });
});