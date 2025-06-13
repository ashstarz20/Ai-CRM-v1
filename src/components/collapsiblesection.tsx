import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string; // add this
}
export function CollapsibleQualifierSection({
  title,
  icon,
  defaultOpen = false,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className}>
      <button onClick={() => setOpen(!open)} className="flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}