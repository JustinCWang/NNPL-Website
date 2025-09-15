"use client";

import { useState } from "react";

type TooltipHoverProps = {
  content: React.ReactNode;
  children: React.ReactNode;
};

export default function TooltipHover({ content, children }: TooltipHoverProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      className="inline-block"
    >
      {children}

      {visible && pos.x !== null && pos.y !== null && (
        <div
          className="fixed bg-gray-800 text-white text-sm rounded-lg shadow-lg pointer-events-none"
          style={{
            top: pos.y + 10,
            left: pos.x + 10,
            width: "max-content",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}