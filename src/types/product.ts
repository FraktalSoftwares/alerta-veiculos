import { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;

export interface ProductDisplay {
  id: string;
  title: string;
  image: string;
  vehicleType: string;
  frequency: string;
  model: string;
  brand: string;
  quantity: number;
  price: number;
  description: string;
  isActive: boolean;
}

export interface CreateProductData {
  title: string;
  price: number;
  description?: string;
  image_url?: string;
  vehicle_type?: string;
  frequency?: string;
  model?: string;
  brand?: string;
  stock_quantity?: number;
  is_active?: boolean;
  equipment_id?: string; // ID do equipamento a vincular
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

export function mapProductToDisplay(product: Product): ProductDisplay {
  return {
    id: product.id,
    title: product.title,
    image: product.image_url || "",
    vehicleType: product.vehicle_type || "",
    frequency: product.frequency || "",
    model: product.model || "",
    brand: product.brand || "",
    quantity: product.stock_quantity || 0,
    price: Number(product.price) || 0,
    description: product.description || "",
    isActive: product.is_active ?? true,
  };
}
