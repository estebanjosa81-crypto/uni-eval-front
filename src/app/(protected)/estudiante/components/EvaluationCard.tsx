
"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { User, CheckCircle2, CircleDashed, ArrowRight } from "lucide-react"
import type { EvalByUserItem } from "@/src/api"

export default function EvaluationCard({
  evaluacion,
  basePath = "/estudiante",
}: {
  evaluacion: EvalByUserItem & { es_finalizada?: boolean | null }
  basePath?: string
}) {
  const router = useRouter()
  const isCompleted = Boolean(evaluacion.es_finalizada)

  return (
    <div className={`group relative bg-white rounded-3xl border transition duration-300 overflow-hidden shadow-md hover:shadow-xl ${
      isCompleted ? "border-green-200" : "border-gray-200"
    }`}>

      {/* Accent bar */}
      <div className={`h-1 w-full ${isCompleted ? "bg-green-400" : "bg-gray-900"}`} />

      <div className="p-6 flex flex-col h-full">

        {/* Title */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            {evaluacion.nombre_materia || "Materia"}
          </h3>
        </div>

        {/* Program & Semester */}
        <div className="mb-5 space-y-2">
          <div>
            <p className="font-light text-gray-900">
              {evaluacion.nom_programa || "N/A"}
            </p>
          </div>
          
          <div>
            <p className="font-light text-gray-900">
              {evaluacion.semestre || "N/A"}
            </p>
          </div>
        </div>

        {/* Teacher */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-3 mb-6">
          <div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>

          <div>
            <p className="text-xs text-gray-500">Docente</p>
            <p className="font-semibold text-gray-900">
              {evaluacion.nombre_docente || "Docente"}
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">

          <Status completed={isCompleted} />

          <Button
            disabled={isCompleted}
            onClick={() =>
              router.push(
                `${basePath}/evaluar/${evaluacion.id_configuracion}` +
                `?evalId=${evaluacion.id}` +
                `&docente=${encodeURIComponent(evaluacion.nombre_docente || "")}` +
                `&cod=${encodeURIComponent(evaluacion.codigo_materia || "")}` +
                `&materia=${encodeURIComponent(evaluacion.nombre_materia || "")}`
              )
            }
            className={`rounded-xl px-5 py-2 font-semibold transition flex items-center gap-2 ${
              isCompleted
                ? "bg-gray-200 text-gray-500"
                : "bg-gray-900 hover:bg-gray-800 text-white"
            }`}
          >
            {isCompleted ? "Completada" : "Evaluar"}
            {!isCompleted && <ArrowRight className="w-4 h-4" />}
          </Button>

        </div>
      </div>
    </div>
  )
}

function Status({ completed }: { completed: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${
      completed ? "text-green-700" : "text-gray-500"
    }`}>
      {completed ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <CircleDashed className="w-4 h-4" />
      )}
      {completed ? "Completada" : "Pendiente"}
    </div>
  )
}
