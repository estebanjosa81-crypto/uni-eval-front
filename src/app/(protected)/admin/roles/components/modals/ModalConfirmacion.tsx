import { useState } from "react";
import { ConfirmDialog } from "@/components/modals";
import { useToast } from "@/hooks/use-toast";

interface ModalConfirmacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
}

export function ModalConfirmacion({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}: ModalConfirmacionProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      toast({
        title: "¡Eliminación exitosa!",
        description: "El elemento se eliminó correctamente",
      });
      onClose();
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el elemento. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={title}
      description={description}
      action="delete"
      isLoading={isLoading}
    />
  );
}

