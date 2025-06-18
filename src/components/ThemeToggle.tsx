
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`
        relative overflow-hidden group
        w-12 h-12 rounded-full border-2 
        transition-all duration-500 ease-in-out
        ${theme === 'dark' 
          ? 'border-yellow-400 bg-slate-800 hover:bg-slate-700' 
          : 'border-blue-400 bg-blue-50 hover:bg-blue-100'
        }
        hover:scale-110 hover:rotate-12
        transform-gpu perspective-1000
      `}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div 
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all duration-700 ease-in-out
          ${theme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : 'rotate-180 scale-0 opacity-0'
          }
        `}
        style={{
          transform: theme === 'dark' 
            ? 'rotateY(0deg) scale(1)' 
            : 'rotateY(180deg) scale(0)',
        }}
      >
        <Moon className="w-5 h-5 text-yellow-400 drop-shadow-glow" />
      </div>
      
      <div 
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all duration-700 ease-in-out
          ${theme === 'light' 
            ? 'rotate-0 scale-100 opacity-100' 
            : 'rotate-180 scale-0 opacity-0'
          }
        `}
        style={{
          transform: theme === 'light' 
            ? 'rotateY(0deg) scale(1)' 
            : 'rotateY(180deg) scale(0)',
        }}
      >
        <Sun className="w-5 h-5 text-blue-600 drop-shadow-glow" />
      </div>
      
      {/* 3D Glow Effect */}
      <div 
        className={`
          absolute inset-0 rounded-full opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          ${theme === 'dark' 
            ? 'bg-yellow-400/20 shadow-[0_0_20px_rgba(251,191,36,0.3)]' 
            : 'bg-blue-400/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
          }
        `}
      />
    </Button>
  );
};
