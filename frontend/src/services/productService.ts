import { dbService } from './dbService';
import { Product } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateProductDTO } from '../types/api';

export const productService = {
  // Create a new crop listing
  async createProduct(farmerId: string, dto: CreateProductDTO): Promise<ServiceResponse<Product>> {
    try {
      const newProduct: Product = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        farmer_id: farmerId,
        title: dto.title,
        description: dto.description || '',
        category: dto.category,
        grade: dto.grade,
        price_per_unit: dto.price_per_unit,
        unit_type: dto.unit_type,
        quantity_available: dto.quantity_available,
        image_url: dto.image_url,
        created_at: new Date().toISOString()
      };
      
      const data = await dbService.createProduct(newProduct);
      return makeResponse(true, 'Product listed successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error creating product listing: ${err.message}`, err.message);
    }
  },

  // Update existing listing details
  async updateProduct(id: string, updates: Partial<Product>): Promise<ServiceResponse<Product>> {
    try {
      const data = await dbService.updateProduct(id, updates);
      if (!data) return makeErrorResponse('Product not found for updates.');
      return makeResponse(true, 'Product listing updated successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected product update error: ${err.message}`, err.message);
    }
  },

  // Delete product listing
  async deleteProduct(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const success = await dbService.deleteProduct(id);
      return makeResponse(true, 'Product listing deleted successfully.', success);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected product deletion error: ${err.message}`, err.message);
    }
  },

  // Toggle publish status of listings
  async publishProduct(id: string, isPublished: boolean): Promise<ServiceResponse<Product>> {
    return this.updateProduct(id, { is_published: isPublished } as any);
  },

  // Retrieve listings using titles or tags search queries
  async searchProducts(query: string): Promise<ServiceResponse<Product[]>> {
    try {
      const list = await dbService.getProducts();
      const matched = list.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) || 
        p.description?.toLowerCase().includes(query.toLowerCase())
      );
      return makeResponse(true, 'Products retrieved successfully.', matched);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error searching products: ${err.message}`, err.message);
    }
  },

  // Filter listings by category tab selection
  async filterProducts(category: string): Promise<ServiceResponse<Product[]>> {
    try {
      const list = await dbService.getProducts();
      const filtered = category === 'All' 
        ? list
        : list.filter(p => p.category === category);
      return makeResponse(true, 'Filtered products retrieved.', filtered);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected filter error: ${err.message}`, err.message);
    }
  },

  // Retrieve active listings published by a specific farmer
  async getFarmerProducts(farmerId: string): Promise<ServiceResponse<Product[]>> {
    try {
      const list = await dbService.getProducts();
      const filtered = list.filter(p => p.farmer_id === farmerId);
      return makeResponse(true, 'Farmer listings retrieved.', filtered);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected farmer search error: ${err.message}`, err.message);
    }
  }
};
export default productService;
