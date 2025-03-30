import React from 'react';

interface BitSectionProps {
  label: string;
  bits: number;
  color: string;
  description?: string;
}

interface UuidStructureDiagramProps {
  sections: BitSectionProps[];
  title: string;
  description: string;
}

const UuidStructureDiagram: React.FC<UuidStructureDiagramProps> = ({ 
  sections, 
  title,
  description 
}) => {
  // Calculate total bits to determine proportions
  const totalBits = sections.reduce((sum, section) => sum + section.bits, 0);
  
  return (
    <div className="uuid-structure-diagram mb-6">
      <h4 className="text-lg font-semibold mb-3">{title}</h4>
      <div className="flex mb-4 w-full h-16 rounded overflow-hidden">
        {sections.map((section, index) => (
          <div 
            key={index}
            style={{ 
              width: `${(section.bits / totalBits) * 100}%`,
              backgroundColor: section.color
            }}
            className="relative flex items-center justify-center p-2 border-r border-white last:border-r-0"
            title={`${section.label}: ${section.bits} bits${section.description ? ` - ${section.description}` : ''}`}
          >
            <div className="text-center font-mono font-bold text-xs px-1 truncate">
              <span className="block">{section.label}</span>
              <span className="block mt-1 text-[10px]">
                {section.bits} bits
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-700 mt-3 leading-relaxed">
        {description}
      </div>
    </div>
  );
};

export default UuidStructureDiagram; 