import React from "react";
import { motion } from "motion/react";
import { Check, Mail, MapPin, CreditCard } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { 
      id: 1, 
      label: "Contact", 
      sublabel: "Email & Phone",
      icon: Mail 
    },
    { 
      id: 2, 
      label: "Shipping", 
      sublabel: "Delivery Address",
      icon: MapPin 
    },
    { 
      id: 3, 
      label: "Payment", 
      sublabel: "Secure Checkout",
      icon: CreditCard 
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="relative flex items-center justify-between">
        
        {/* Background Line (Gray) */}
        <div className="absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-[#E8E1D3] z-0" />
        
        {/* Animated Progress Line (Gold) */}
        <motion.div
          className="absolute top-[28px] left-[10%] h-[2px] bg-gradient-to-r from-[#254936] to-[#B69355] z-[1]"
          initial={{ width: "0%" }}
          animate={{ 
            width: currentStep === 1 ? "0%" : 
                   currentStep === 2 ? "40%" : "80%"
          }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />

        {/* Steps */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3 flex-1">
              
              {/* Circle with Icon */}
              <motion.div
                className={`relative flex items-center justify-center transition-all duration-500 ${
                  isCompleted 
                    ? "w-[56px] h-[56px] bg-[#254936] border-2 border-[#B69355] shadow-lg shadow-[#B69355]/20" 
                    : isActive
                    ? "w-[56px] h-[56px] bg-white border-2 border-[#254936] shadow-lg shadow-[#254936]/20"
                    : "w-[56px] h-[56px] bg-[#F4EBDB] border-2 border-[#E8E1D3]"
                } rounded-full`}
                animate={isActive ? { 
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{ 
                  duration: 2,
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4, type: "spring" }}
                  >
                    <Check className="w-6 h-6 text-[#B69355]" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive ? "text-[#254936]" : "text-[#A8A29E]"
                    }`} 
                    strokeWidth={1.8} 
                  />
                )}

                {/* Pulse ring for active step */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#254936]"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                )}
              </motion.div>

              {/* Labels */}
              <div className="text-center flex flex-col gap-0.5">
                <motion.span
                  className={`text-[11px] md:text-[12px] font-bold uppercase tracking-[1.5px] transition-colors duration-300 ${
                    isCompleted 
                      ? "text-[#254936]" 
                      : isActive
                      ? "text-[#254936]"
                      : "text-[#A8A29E]"
                  }`}
                  animate={isActive ? { y: [0, -2, 0] } : {}}
                  transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                >
                  {step.label}
                </motion.span>
                <span 
                  className={`text-[9px] md:text-[10px] font-medium transition-colors duration-300 ${
                    isCompleted || isActive ? "text-[#B69355]" : "text-[#A8A29E]"
                  }`}
                >
                  {step.sublabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;