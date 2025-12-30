"use client";
/*
  PopUpMenu component for displaying a modal with a trigger.
  - Displays a modal with a trigger
  - Displays the modal content when the trigger is clicked
  - Closes the modal when the user clicks outside the modal content
  - Closes the modal when the user presses the escape key
*/

import { useState, useRef, useEffect } from "react";

type PopUpMenuProps = {
  trigger: React.ReactNode;   // content that opens the modal
  children: React.ReactNode;  // modal content
};

export default function PopUpMenu({ trigger, children }: PopUpMenuProps) {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside the modal content
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      {/* Trigger (click to open modal) */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer"
      >
        {trigger}
      </a>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Grey overlay */}
          <div className="absolute inset-0 bg-black opacity-50"></div>

          {/* Centered modal content */}
          <div
            ref={modalRef}
            className="relative bg-white rounded-lg shadow-xl max-w-7xl m-12 w-full p-6 z-10 animate-fadeIn"
          >
            {/* Close button (top-right corner) */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 h-8 w-8 text-gray-600 hover:text-black cursor-pointer text-2xl font-bold"
            >
              ✕
            </button>

            {children}
          </div>
        </div>
      )}
    </>
  );
}
