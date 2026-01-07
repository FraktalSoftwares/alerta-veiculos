import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export function useProductImages(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-images", productId],
    queryFn: async (): Promise<ProductImage[]> => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
}

export function useProductImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('produtos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    return urls;
  };

  return {
    uploadImage,
    uploadMultipleImages,
    isUploading,
  };
}

export function useCreateProductImages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProductImages = async (
    productId: string, 
    imageUrls: string[]
  ): Promise<boolean> => {
    try {
      const imagesToInsert = imageUrls.map((url, index) => ({
        product_id: productId,
        image_url: url,
        is_primary: index === 0,
        display_order: index,
      }));

      const { error } = await supabase
        .from('product_images')
        .insert(imagesToInsert);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao salvar imagens",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { createProductImages };
}

export function useDeleteProductImage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteProductImage = async (
    imageId: string, 
    imageUrl: string,
    productId: string
  ): Promise<boolean> => {
    try {
      // Deletar do storage
      const path = imageUrl.split('/produtos/')[1];
      if (path) {
        await supabase.storage.from('produtos').remove([path]);
      }

      // Deletar do banco
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao remover imagem",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { deleteProductImage };
}

export function useAddProductImage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadImage, isUploading } = useProductImageUpload();

  const addProductImage = async (
    productId: string, 
    file: File,
    displayOrder: number = 0
  ): Promise<boolean> => {
    try {
      const imageUrl = await uploadImage(file);
      if (!imageUrl) return false;

      const { error } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrl,
          is_primary: displayOrder === 0,
          display_order: displayOrder,
        });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar imagem",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { addProductImage, isUploading };
}
