import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, Loader2, BookOpen, User, Clock, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModalEvaluacionesCreadasProps {
  isOpen: boolean;
  onClose: () => void;
  evaluaciones: {
    materia: { nombre: string };
    docente: { nombre: string };
  }[];
  isLoading?: boolean;
}

const loadingSteps = [
  { text: "Verificando materias inscritas...", icon: BookOpen, delay: 0 },
  { text: "Consultando docentes asignados...", icon: User, delay: 1000 },
  { text: "Generando formularios de evaluación...", icon: Sparkles, delay: 2000 },
  { text: "Finalizando configuración...", icon: Zap, delay: 3000 },
];

export function ModalEvaluacionesCreadas({
  isOpen,
  onClose,
  evaluaciones,
  isLoading = false,
}: ModalEvaluacionesCreadasProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (isLoading) {
      setCurrentStep(0);
      setCompletedSteps([]);
      
      // Simular progreso de pasos
      loadingSteps.forEach((step, index) => {
        setTimeout(() => {
          setCurrentStep(index);
          setTimeout(() => {
            setCompletedSteps(prev => [...prev, index]);
          }, 800);
        }, step.delay);
      });
    }
  }, [isLoading]);

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Solo permitir cerrar si no está cargando
        if (!isLoading && !open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl overflow-hidden">
        {isLoading ? (
          // Estado de carga mejorado con animaciones
          <>
            <DialogHeader>
              <div className="flex flex-col items-center text-center space-y-6 py-4">
                {/* Spinner principal con efectos */}
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-green-400 rounded-full animate-spin animate-reverse delay-75"></div>
                  <div className="absolute inset-2 w-16 h-16 bg-gradient-to-br from-blue-50 to-green-50 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                  {/* Partículas flotantes */}
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                  <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-green-400 rounded-full animate-bounce delay-300"></div>
                  <div className="absolute top-1/2 -left-4 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-500"></div>
                </div>
                
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-gray-900 animate-pulse">
                    Creando evaluaciones
                  </DialogTitle>
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-0"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            <div className="py-8 space-y-6">
              <p className="text-center text-gray-600 text-lg font-medium">
                Por favor espera mientras configuramos todo para ti
              </p>
              
              {/* Barra de progreso animada */}
              <div className="max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-1000 ease-out animate-shimmer"
                    style={{ 
                      width: `${(completedSteps.length / loadingSteps.length) * 100}%`,
                      background: completedSteps.length === loadingSteps.length 
                        ? 'linear-gradient(90deg, #10b981, #059669)' 
                        : 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)'
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Pasos de progreso con animaciones */}
              <div className="space-y-4 max-w-lg mx-auto">
                {loadingSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === index;
                  const isCompleted = completedSteps.includes(index);
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-500 ${
                        isActive 
                          ? 'bg-blue-50 border-2 border-blue-200 scale-105 shadow-lg' 
                          : isCompleted
                          ? 'bg-green-50 border-2 border-green-200'
                          : 'bg-gray-50 border-2 border-transparent opacity-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-100' 
                          : isActive 
                          ? 'bg-blue-100 animate-pulse' 
                          : 'bg-gray-100'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600 animate-bounce" />
                        ) : (
                          <StepIcon className={`w-5 h-5 ${
                            isActive ? 'text-blue-600 animate-pulse' : 'text-gray-400'
                          }`} />
                        )}
                      </div>
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        isCompleted 
                          ? 'text-green-700' 
                          : isActive 
                          ? 'text-blue-700' 
                          : 'text-gray-500'
                      }`}>
                        {step.text}
                      </span>
                      {isActive && (
                        <div className="ml-auto">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Mensaje motivacional */}
              <div className="text-center space-y-2 pt-4">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  <span>Esto tomará solo unos segundos</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Estado de éxito con evaluaciones creadas
          <>
            <DialogHeader>
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Animación de éxito */}
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  {/* Efectos de celebración */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-blue-400 rounded-full animate-ping delay-100"></div>
                  <div className="absolute top-1/2 -right-4 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-200"></div>
                </div>
                
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    ¡Evaluaciones creadas exitosamente!
                  </DialogTitle>
                  <p className="text-green-600 font-medium">
                    Todo está listo para comenzar
                  </p>
                </div>
              </div>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-600 text-lg">
                  Se generaron <span className="font-bold text-gray-900">{evaluaciones.length}</span> evaluaciones para tus materias:
                </p>
              </div>
              
              {/* Lista de evaluaciones con animaciones de entrada */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {evaluaciones.map((ev, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center space-x-4 p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate text-lg">
                        {ev.materia.nombre}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate font-medium">{ev.docente.nombre}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Listo</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Mensaje de motivación */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-blue-700">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">¡Ya puedes comenzar a evaluar!</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Cada evaluación te tomará aproximadamente 5-10 minutos
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={onClose}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Comenzar Evaluaciones</span>
                  <Zap className="w-5 h-5" />
                </div>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
      
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        @keyframes reverse {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .animate-reverse {
          animation: reverse 3s linear infinite;
        }
      `}</style>
    </Dialog>
  );
}