import React from "react";
import { Check, Columns, Sparkles, Layout, Compass, Shield } from "lucide-react";
import { TemplateId } from "../types";

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelect: (id: TemplateId) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  title?: string;
}

const TEMPLATE_DESIGNS = [
  {
    id: "modern" as TemplateId,
    name: "Modern Accent",
    description: "Sleek modern design with colorful side-accent headers, compact timeline bullets, and a professional layout.",
    badge: "Most Popular",
    icon: Compass,
    vibes: "Creative / Tech / Startups",
  },
  {
    id: "split" as TemplateId,
    name: "Split Columns",
    description: "Elegant double-column layout with contact details & skills matrix in a left sidebar, and experience on the right.",
    badge: "High Density",
    icon: Columns,
    vibes: "Engineering / Product / Sales",
  },
  {
    id: "minimal" as TemplateId,
    name: "Minimal Single",
    description: "Swiss minimalism featuring clean negative space, horizontal divider rules, and sophisticated layout margins.",
    badge: "Timeless Swiss",
    icon: Layout,
    vibes: "Academics / Corporate / Editorial",
  },
  {
    id: "executive" as TemplateId,
    name: "Executive Serif",
    description: "Classic serif typography, centered headers, traditional layout margins, and bulleted expertise separators.",
    badge: "Senior Leadership",
    icon: Shield,
    vibes: "Executive / Law / Consulting",
  },
];

const PRESET_COLORS = [
  { name: "Ocean Blue", value: "#0284c7" },
  { name: "Emerald Forest", value: "#0f766e" },
  { name: "Crimson Red", value: "#b91c1c" },
  { name: "Royal Indigo", value: "#4f46e5" },
  { name: "Luxury Gold", value: "#b45309" },
  { name: "Midnight Slate", value: "#334155" },
];

export default function TemplateSelector({
  selectedTemplate,
  onSelect,
  selectedColor,
  onSelectColor,
  title = "Choose a Professional Design Template"
}: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Select a manually crafted layout blueprint. The skills matrix and sections will dynamically adapt their spacing and structural arrangement to match your selected aesthetic!
        </p>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATE_DESIGNS.map((temp) => {
            const IconComponent = temp.icon;
            const isSelected = selectedTemplate === temp.id;
            return (
              <button
                key={temp.id}
                type="button"
                onClick={() => onSelect(temp.id)}
                className={`text-left rounded-xl border p-4 transition-all duration-200 relative overflow-hidden group hover:shadow-md cursor-pointer ${
                  isSelected
                    ? "bg-white border-2 shadow-sm"
                    : "bg-slate-50/70 hover:bg-white border-slate-200"
                }`}
                style={{
                  borderColor: isSelected ? selectedColor : undefined,
                }}
              >
                {/* Active Check Accent */}
                {isSelected && (
                  <div 
                    className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center rounded-bl-3xl"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <Check className="w-4 h-4 text-white font-black translate-x-1 -translate-y-1" />
                  </div>
                )}

                <div className="flex items-start space-x-3.5 pr-8">
                  <div 
                    className="p-2.5 rounded-lg shrink-0 transition-transform group-hover:scale-110"
                    style={{ 
                      backgroundColor: isSelected ? selectedColor + "15" : "#f1f5f9",
                      color: isSelected ? selectedColor : "#64748b" 
                    }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">{temp.name}</span>
                      {temp.badge && (
                        <span 
                          style={{ 
                            backgroundColor: isSelected ? selectedColor + "10" : "#f1f5f9",
                            color: isSelected ? selectedColor : "#64748b"
                          }}
                          className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-95 origin-left"
                        >
                          {temp.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                      {temp.description}
                    </p>
                    <div className="pt-1 flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
                      <span>Vibe:</span>
                      <span className="font-semibold text-slate-500">{temp.vibes}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors Accent Block */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2.5">
          Select Brand Accent Color
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((col) => (
            <button
              key={col.name}
              type="button"
              onClick={() => onSelectColor(col.value)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all text-xs font-semibold shadow-sm cursor-pointer"
              style={{
                borderColor: selectedColor === col.value ? selectedColor : undefined,
                color: selectedColor === col.value ? selectedColor : "#475569",
              }}
            >
              <span 
                className="w-3 h-3 rounded-full border border-black/10 shrink-0" 
                style={{ backgroundColor: col.value }}
              />
              <span>{col.name}</span>
            </button>
          ))}
          {/* Custom Color input */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Custom:</span>
            <input 
              type="color" 
              value={selectedColor}
              onChange={(e) => onSelectColor(e.target.value)}
              className="w-5 h-5 bg-transparent border-0 cursor-pointer outline-none rounded p-0"
              title="Custom Hex color"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
