import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Product, 
  ProductDisplay, 
  CreateProductData, 
  UpdateProductData,
  mapProductToDisplay 
} from "@/types/product";

interface UseProductsOptions {
  search?: string;
  activeOnly?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { search, activeOnly = false } = options;

  return useQuery({
    queryKey: ["products", search, activeOnly],
    queryFn: async (): Promise<ProductDisplay[]> => {
      let query = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(mapProductToDisplay);
    },
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async (): Promise<ProductDisplay | null> => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapProductToDisplay(data);
    },
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      const { data: product, error } = await supabase
        .from("products")
        .insert({
          title: data.title,
          price: data.price,
          description: data.description,
          image_url: data.image_url,
          vehicle_type: data.vehicle_type,
          frequency: data.frequency,
          model: data.model,
          brand: data.brand,
          stock_quantity: data.stock_quantity || 0,
          is_active: data.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Produto criado",
        description: "O produto foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateProductData) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.image_url !== undefined) updateData.image_url = data.image_url;
      if (data.vehicle_type !== undefined) updateData.vehicle_type = data.vehicle_type;
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.model !== undefined) updateData.model = data.model;
      if (data.brand !== undefined) updateData.brand = data.brand;
      if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const { data: product, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: string) => {
      // Verificar se há referências em order_items
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("id")
        .eq("product_id", productId)
        .limit(1);

      if (orderItemsError) throw orderItemsError;

      if (orderItems && orderItems.length > 0) {
        throw new Error(
          "Não é possível excluir este produto pois ele está sendo usado em pedidos. " +
          "Desative o produto ao invés de excluí-lo."
        );
      }

      // Verificar se há referências em equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from("equipment")
        .select("id")
        .eq("product_id", productId)
        .limit(1);

      if (equipmentError) throw equipmentError;

      if (equipment && equipment.length > 0) {
        throw new Error(
          "Não é possível excluir este produto pois ele está associado a equipamentos. " +
          "Desative o produto ao invés de excluí-lo."
        );
      }

      // Se não houver referências, pode excluir
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) {
        // Se for erro 409 (Conflict), provavelmente ainda há referências
        if (error.code === "23503" || error.message.includes("violates foreign key constraint")) {
          throw new Error(
            "Não é possível excluir este produto pois ele está sendo usado no sistema. " +
            "Desative o produto ao invés de excluí-lo."
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Produto removido",
        description: "O produto foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover produto",
        description: error.message || "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    },
  });
}
