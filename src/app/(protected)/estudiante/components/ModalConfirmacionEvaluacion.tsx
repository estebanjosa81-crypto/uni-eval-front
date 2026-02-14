import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModalConfirmacionEvaluacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
}

export function ModalConfirmacionEvaluacion({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}: ModalConfirmacionEvaluacionProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      toast({
        title: "¡Evaluación enviada exitosamente!",
        description: "Tu evaluación ha sido registrada correctamente.",
      });
      onClose();
    } catch (error) {
      console.error("❌ Error al enviar evaluación:", error);
      toast({
        title: "Error al enviar evaluación",
        description: "No se pudo enviar la evaluación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <AlertCircle className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-center">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-gray-600 px-1">
          <p className="text-center">{description}</p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-amber-800 font-medium text-sm">
                  Importante:
                </p>
                <p className="text-amber-700 text-sm">
                  Una vez enviada, no podrás modificar ni editar tu evaluación. 
                  Esta será tu respuesta final.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Revisar nuevamente
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando evaluación...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Confirmar y enviar
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}