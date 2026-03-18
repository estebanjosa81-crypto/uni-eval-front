import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGOS } from "../../types/constants";
import { FaUsers, FaGithub, FaCrown, FaCode } from "react-icons/fa";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Developer {
  firstName: string;
  lastName: string;
  github: string;
  avatar: string;
}

const developers: Developer[] = [
  {
    firstName: "Jhon Esteban",
    lastName: "Josa Quinchoa",
    github: "https://github.com/esteban2oo1",
    avatar: "https://avatars.githubusercontent.com/u/115267707?v=4",
  },
  {
    firstName: "Maicol Sebastián",
    lastName: "Guerrero López",
    github: "https://github.com/mclguerrero",
    avatar: "https://avatars.githubusercontent.com/u/134365120?v=4",
  },
];

const shuffleArray = <T,>(array: T[]): T[] =>
  [...array].sort(() => Math.random() - 0.5);

export const DevelopersButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [shuffledDevelopers, setShuffledDevelopers] = useState<Developer[]>([]);

  useEffect(() => {
    setShuffledDevelopers(shuffleArray(developers));
  }, []);

  return (
    <>
      {/* Botón */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-all duration-200 transform hover:scale-105 text-sm group"
      >
        <div className="relative flex items-center justify-center w-5 h-5">
          <FaUsers
            size={18}
            className="text-gray-600 group-hover:text-blue-700 transition-colors"
          />
          <FaCode
            size={11}
            className="absolute -bottom-1 -right-1 text-blue-600 bg-white rounded-full shadow-sm"
          />
        </div>
        <span className="font-medium">Equipo</span>
      </button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90%] sm:max-w-[80%] md:max-w-fit lg:max-w-fit rounded-2xl shadow-2xl border border-gray-200/50 bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md backdrop-brightness-50">
          <DialogHeader>
            <motion.img
              src={LOGOS.full}
              alt="Logo Institución Universitaria del Putumayo"
              className="h-[70px] mx-auto mb-4 opacity-95"
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
            />

            <DialogTitle className="text-center text-xl font-bold text-gray-900 tracking-wide mt-1">
              Equipo de Desarrollo
            </DialogTitle>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-6 text-center"
          >
            {/* Líder */}
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-yellow-300/60 shadow-md hover:shadow-lg transition-all relative overflow-hidden"
            >
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-yellow-400/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <FaCrown className="w-5 h-5 text-yellow-500" />
                  <p className="uppercase text-xs tracking-widest text-yellow-600 font-semibold">
                    Líder del Proyecto
                  </p>
                </div>
                <p className="text-lg font-semibold text-gray-800 mb-1">
                  MSc. Jhon Henry Cuellar Portilla
                </p>
                <p className="text-sm text-gray-600">
                  Director de proyecto
                </p>
              </div>
            </motion.div>

            {/* Separador */}
            <div className="relative flex items-center justify-center">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300/70 to-transparent" />
              <FaCode className="w-5 h-5 text-gray-400 bg-white p-1 absolute" />
            </div>

            {/* Desarrolladores */}
            <div className="p-5 rounded-2xl bg-white/70 border border-gray-200/60 shadow-md">
              <p className="uppercase text-[11px] tracking-widest text-gray-500 mb-3">
                Desarrolladores
              </p>

              <div className="space-y-3">
                {shuffledDevelopers.map((dev, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 120, damping: 15 }}
                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/50 group"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={dev.avatar}
                        alt={`${dev.firstName} ${dev.lastName}`}
                        className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm"
                      />
                      <p className="font-medium text-gray-800 text-left">
                        {dev.firstName}
                        <br />
                        {dev.lastName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaGithub className="w-5 h-5 text-sky-600" />
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-sky-600"
                      >
                        GitHub
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-2">
              <p className="text-xs text-gray-500 tracking-wider">
                © {new Date().getFullYear()} Institución Universitaria del Putumayo
              </p>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};
