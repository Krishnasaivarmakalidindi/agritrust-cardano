import { supabase } from './supabaseClient';
import { Product } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateProductDTO } from '../types/api';

export const productService = {
  // Create a new crop listing in Supabase
  async createProduct(farmerId: string, dto: CreateProductDTO): Promise<ServiceResponse<Product>> {
    try {
      const newProduct = {
        farmer_id: farmerId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        grade: dto.grade,
        price_per_unit: dto.price_per_unit,
        unit_type: dto.unit_type,
        quantity_available: dto.quantity_available,
        image_url: dto.image_url,
        is_published: true
      };

      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to create product listing: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Product listed successfully.', data as Product);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error creating product listing: ${err.message}`, err.message);
    }
  },

  // Update existing listing details
  async updateProduct(id: string, updates: Partial<Product>): Promise<ServiceResponse<Product>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to update product listing: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Product listing updated successfully.', data as Product);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected product update error: ${err.message}`, err.message);
    }
  },

  // Delete product listing
  async deleteProduct(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        return makeErrorResponse(`Failed to delete product listing: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Product listing deleted successfully.', true);
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
      const { data, error } = await supabase
        .from('products')
        .select('*, farmer:profiles(*)')
        .ilike('title', `%${query}%`);

      if (error) {
        return makeErrorResponse(`Product search failed: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Products retrieved successfully.', data as Product[]);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error searching products: ${err.message}`, err.message);
    }
  },

  // Filter listings by category tab selection
  async filterProducts(category: string): Promise<ServiceResponse<Product[]>> {
    try {
      let query = supabase.from('products').select('*, farmer:profiles(*)').eq('is_published', true);
      
      if (category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) {
        return makeErrorResponse(`Failed to filter products: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Filtered products retrieved.', data as Product[]);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected filter error: ${err.message}`, err.message);
    }
  },

  // Retrieve active listings published by a specific farmer
  async getFarmerProducts(farmerId: string): Promise<ServiceResponse<Product[]>> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', farmerId);

      if (error) {
        return makeErrorResponse(`Failed to fetch farmer listings: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Farmer listings retrieved.', data as Product[]);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected farmer search error: ${err.message}`, err.message);
    }
  }
};
export default productService;
