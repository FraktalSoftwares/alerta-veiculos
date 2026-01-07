import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useUpdateProduct } from "@/hooks/useProducts";
import { useProductImages, useDeleteProductImage, useAddProductImage } from "@/hooks/useProductImages";
import { ProductDisplay } from "@/types/product";
import { Loader2, Camera, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, parseCurrency } from "@/lib/formatters";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDisplay | null;
}

export function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const updateProduct = useUpdateProduct();
  const { data: productImages = [], isLoading: isLoadingImages } = useProductImages(product?.id);
  const { deleteProductImage } = useDeleteProductImage();
  const { addProductImage, isUploading } = useAddProductImage();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    vehicle_type: "",
    frequency: "",
    model: "",
    brand: "",
    stock_quantity: "",
    is_active: true,
  });

  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title,
        price: formatCurrency(product.price),
        description: product.description || "",
        vehicle_type: product.vehicleType || "",
        frequency: product.frequency || "",
        model: product.model || "",
        brand: product.brand || "",
        stock_quantity: product.quantity.toString(),
        is_active: product.isActive,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    if (!formData.title || !formData.price) {
      toast.error("Título e preço são obrigatórios");
      return;
    }

    try {
      // Atualiza a imagem principal do produto baseado nas imagens atuais
      const primaryImage = productImages.find(img => img.is_primary)?.image_url || productImages[0]?.image_url;

      await updateProduct.mutateAsync({ 
        id: product.id, 
        title: formData.title,
        price: parseCurrency(formData.price),
        description: formData.description || undefined,
        image_url: primaryImage || undefined,
        vehicle_type: formData.vehicle_type || undefined,
        frequency: formData.frequency || undefined,
        model: formData.model || undefined,
        brand: formData.brand || undefined,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        is_active: formData.is_active,
      });
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!product) return;
    
    setDeletingImageId(imageId);
    await deleteProductImage(imageId, imageUrl, product.id);
    setDeletingImageId(null);
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    await addProductImage(product.id, file, productImages.length);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit-title">
                  Título<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price">
                  Preço<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-price"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, price: formatCurrency(value) });
                  }}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-stock">Quantidade em Estoque</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-brand">Marca</Label>
                <Input
                  id="edit-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Marca do produto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-model">Modelo</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Modelo do produto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-vehicle-type">Tipo de Veículo</Label>
                <Input
                  id="edit-vehicle-type"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  placeholder="Carro, Moto, Caminhão..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-frequency">Frequência</Label>
                <Input
                  id="edit-frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  placeholder="4G, 3G, etc."
                />
              </div>

              {/* Seção de Imagens */}
              <div className="md:col-span-2 space-y-3">
                <Label>Imagens do Produto</Label>
                
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAddImage}
                  className="hidden"
                />

                {isLoadingImages ? (
                  <div className="flex items-center justify-center h-[100px] border border-dashed border-border rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {productImages.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative w-[120px] h-[100px] rounded-lg overflow-hidden border border-border group"
                      >
                        <img
                          src={image.image_url}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteImage(image.id, image.image_url)}
                          disabled={deletingImageId === image.id}
                        >
                          {deletingImageId === image.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}

                    {productImages.length < 5 && (
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-shrink-0 w-[120px] h-[100px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground/50 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Camera className="h-5 w-5" />
                            <span className="text-xs">Adicionar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {productImages.length}/5 imagens. Formatos: JPG, PNG, WebP, GIF (max 5MB cada)
                </p>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <Switch
                  id="edit-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-active">Produto ativo</Label>
              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-foreground hover:bg-foreground/90 text-background"
            disabled={updateProduct.isPending || isUploading}
          >
            {updateProduct.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
