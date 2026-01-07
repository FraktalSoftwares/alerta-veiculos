import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { StorePageHeader } from "@/components/store/StorePageHeader";
import { StoreTable } from "@/components/store/StoreTable";
import { BuyerStoreTable } from "@/components/store/BuyerStoreTable";
import { NewProductModal } from "@/components/store/NewProductModal";
import { EditProductModal } from "@/components/store/EditProductModal";
import { DeleteProductDialog } from "@/components/store/DeleteProductDialog";
import { CartButton } from "@/components/store/CartButton";
import { CheckoutDrawer } from "@/components/store/CheckoutDrawer";
import { CartProvider } from "@/components/store/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { ProductDisplay } from "@/types/product";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const LojaContent = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDisplay | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const isAdmin = profile?.user_type === 'admin';
  const isBuyer = profile?.user_type === 'associacao' || profile?.user_type === 'franqueado';

  const { data: products = [], isLoading } = useProducts({ 
    search: searchValue,
    activeOnly: isBuyer // Buyers only see active products
  });

  const handleNewProductClick = () => {
    setIsModalOpen(true);
  };

  const handleProductClick = (product: ProductDisplay) => {
    toast({
      title: "Produto selecionado",
      description: `${product.title} - ${product.brand || "Sem marca"}`,
    });
  };

  const handleEditProduct = (product: ProductDisplay) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (product: ProductDisplay) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="px-[50px] py-8">
        <StorePageHeader
          title="Loja"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onNewProductClick={isAdmin ? handleNewProductClick : undefined}
          showNewButton={isAdmin}
        />
        
        {isAdmin ? (
          <StoreTable 
            products={products} 
            onProductClick={handleProductClick}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            isLoading={isLoading}
          />
        ) : (
          <BuyerStoreTable 
            products={products}
            isLoading={isLoading}
          />
        )}

        {isAdmin && (
          <>
            <NewProductModal
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
            />

            <EditProductModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedProduct(null);
              }}
              product={selectedProduct}
            />

            <DeleteProductDialog
              isOpen={isDeleteDialogOpen}
              onClose={() => {
                setIsDeleteDialogOpen(false);
                setSelectedProduct(null);
              }}
              product={selectedProduct}
            />
          </>
        )}

        {isBuyer && (
          <>
            <CartButton onClick={() => setIsCheckoutOpen(true)} />
            <CheckoutDrawer
              open={isCheckoutOpen}
              onOpenChange={setIsCheckoutOpen}
            />
          </>
        )}
      </main>
    </div>
  );
};

const Loja = () => {
  return (
    <CartProvider>
      <LojaContent />
    </CartProvider>
  );
};

export default Loja;
