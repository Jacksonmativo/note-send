import { Type, Palette, SmilePlus, ImageIcon, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

interface ToolbarProps {
  onToolSelect: (tool: string) => void;
  activeTool: string | null;
}

const tools = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'backgrounds', label: 'Backgrounds', icon: Palette },
  { id: 'stickers', label: 'Stickers', icon: SmilePlus },
  { id: 'upload', label: 'Upload', icon: ImageIcon },
  { id: 'draw', label: 'Draw', icon: Pencil },
];

export default function Toolbar({ onToolSelect, activeTool }: ToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border-b border-border px-4 py-3"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(activeTool === tool.id ? null : tool.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  activeTool === tool.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tool.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}