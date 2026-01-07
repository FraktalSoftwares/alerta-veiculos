import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateProduct } from "@/hooks/useProducts";
import { useAvailableEquipmentsForStore, useLinkEquipmentToStore } from "@/hooks/useEquipment";
import { formatCurrency, parseCurrency } from "@/lib/formatters";
import { ProductImageUpload } from "./ProductImageUpload";
import { useProductImageUpload, useCreateProductImages } from "@/hooks/useProductImages";

interface SelectedEquipment {
  id: string;
  imei: string;
  serial_number: string;
}

interface NewProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadedImage {
  id?: string;
  url: string;
  file?: File;
}

export function NewProductModal({ open, onOpenChange }: NewProductModalProps) {
  const [titulo, setTitulo] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [searchEquipment, setSearchEquipment] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const createProduct = useCreateProduct();
  const linkEquipmentToStore = useLinkEquipmentToStore();
  const { data: availableEquipments, isLoading: isLoadingEquipments } = useAvailableEquipmentsForStore(searchEquipment);
  const { uploadMultipleImages, isUploading } = useProductImageUpload();
  const { createProductImages } = useCreateProductImages();

  const resetForm = () => {
    setTitulo("");
    setPreco("");
    setDescricao("");
    setMarca("");
    setModelo("");
    setTipoVeiculo("");
    setFrequencia("");
    setSearchEquipment("");
    setSelectedEquipment(null);
    setImages([]);
  };

  const handleSubmit = async () => {
    if (!titulo || !preco) return;

    const precoNumerico = parseCurrency(preco);

    // Upload das imagens que têm arquivo (novas imagens)
    const filesToUpload = images.filter(img => img.file).map(img => img.file!);
    let imageUrls: string[] = [];
    
    if (filesToUpload.length > 0) {
      imageUrls = await uploadMultipleImages(filesToUpload);
    }

    const product = await createProduct.mutateAsync({
      title: titulo,
      price: precoNumerico,
      description: descricao,
      brand: marca,
      model: modelo,
      vehicle_type: tipoVeiculo,
      frequency: frequencia,
      stock_quantity: selectedEquipment ? 1 : 0,
      image_url: imageUrls[0] || undefined, // Primeira imagem como principal
    });

    // Salvar todas as imagens na tabela product_images
    if (product && imageUrls.length > 0) {
      await createProductImages(product.id, imageUrls);
    }

    // Se tiver equipamento selecionado, vincular ao produto
    if (selectedEquipment && product) {
      await linkEquipmentToStore.mutateAsync({
        equipmentId: selectedEquipment.id,
        productId: product.id,
      });
    }

    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSelectEquipment = (equipment: { id: string; imei: string | null; serial_number: string }) => {
    setSelectedEquipment({
      id: equipment.id,
      imei: equipment.imei || "",
      serial_number: equipment.serial_number,
    });
    setSearchEquipment("");
  };

  const handleRemoveEquipment = () => {
    setSelectedEquipment(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-medium">
            Novo Produto
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="px-6 pb-6 space-y-6">
            <div className="border border-border rounded-lg p-6 space-y-6">
              {/* Título e Preço */}
              <div className="grid grid-cols-[1fr_150px] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    placeholder="Nome do produto"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço *</Label>
                  <Input
                    id="preco"
                    placeholder="R$ 0,00"
                    value={preco}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setPreco(formatCurrency(value));
                    }}
                  />
                </div>
              </div>

              {/* Marca, Modelo, Tipo de Veículo, Frequência */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    placeholder="Marca"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    placeholder="Modelo"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoVeiculo">Tipo de Veículo</Label>
                  <Input
                    id="tipoVeiculo"
                    placeholder="Moto, Carro..."
                    value={tipoVeiculo}
                    onChange={(e) => setTipoVeiculo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequencia">Frequência</Label>
                  <Input
                    id="frequencia"
                    placeholder="4G, 3G..."
                    value={frequencia}
                    onChange={(e) => setFrequencia(e.target.value)}
                  />
                </div>
              </div>

              {/* Vincular Rastreador do Estoque */}
              <div className="space-y-3">
                <Label>Vincular Rastreador do Estoque</Label>
                
                {selectedEquipment ? (
                  <div className="flex items-center gap-2 p-3 border border-primary/30 bg-primary/5 rounded-lg">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      Na Loja
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">IMEI: {selectedEquipment.imei || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Serial: {selectedEquipment.serial_number}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveEquipment}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por IMEI ou Número de Série..."
                        value={searchEquipment}
                        onChange={(e) => setSearchEquipment(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {searchEquipment && (
                      <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto">
                        {isLoadingEquipments ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            Carregando...
                          </div>
                        ) : availableEquipments && availableEquipments.length > 0 ? (
                          <div className="divide-y divide-border">
                            {availableEquipments.map((equipment) => (
                              <button
                                key={equipment.id}
                                type="button"
                                className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                                onClick={() => handleSelectEquipment(equipment)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium">
                                      IMEI: {equipment.imei || "N/A"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Serial: {equipment.serial_number}
                                      {equipment.chip_operator && ` • ${equipment.chip_operator}`}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                    Disponível
                                  </Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            Nenhum rastreador disponível encontrado
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Busque um rastreador disponível no estoque para vincular a este produto. 
                      Após vinculado, o status do equipamento será alterado para "Na Loja".
                    </p>
                  </>
                )}
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Forneça uma descrição para o produto"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Upload de Imagens */}
              <div className="space-y-2">
                <Label>Imagens do Produto</Label>
                <ProductImageUpload
                  images={images}
                  onImagesChange={setImages}
                  isUploading={isUploading}
                  maxImages={5}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <Button variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!titulo || !preco || createProduct.isPending || linkEquipmentToStore.isPending || isUploading}
            className="bg-foreground text-background hover:bg-foreground/90 gap-2 px-8"
          >
            <Check className="h-4 w-4" />
            {isUploading ? "Enviando imagens..." : createProduct.isPending || linkEquipmentToStore.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}