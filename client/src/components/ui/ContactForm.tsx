"use client";
/*
  Contact form component for the landing page
  - Displays a form for the user to contact the website owner
  - Displays a message when the user submits the form
*/

import { FormEvent } from "react";

interface ContactFormProps {
  className?: string;
}

/**
 * Contact form component for the landing page
 */
export default function ContactForm({ className = "" }: ContactFormProps) {
  // Contact form submit handler (client-side placeholder)
  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const message = String(formData.get("message") || "");
    if (!name || !email || !message) {
      alert("Please complete all fields.");
      return;
    }
    alert("Thanks! Your message has been received.");
    (event.currentTarget as HTMLFormElement).reset();
  }

  return (
    <div className={`theme-card max-w-xl mx-auto rounded-2xl p-8 ${className}`}>
      <h2 className="text-2xl font-semibold text-center text-theme-foreground">Contact Us</h2>
      <form onSubmit={handleContactSubmit} className="mt-8 grid gap-4">
        <div>
          <label className="block text-sm font-medium text-theme-foreground">Name</label>
          <input 
            name="name" 
            type="text" 
            required 
            className="theme-input mt-1 w-full rounded-md px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-foreground">Email</label>
          <input 
            name="email" 
            type="email" 
            required 
            className="theme-input mt-1 w-full rounded-md px-3 py-2" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-foreground">Message</label>
          <textarea 
            name="message" 
            rows={5} 
            required 
            className="theme-input mt-1 w-full rounded-md px-3 py-2" 
          />
        </div>
        <div>
          <button 
            type="submit" 
            className="theme-button inline-flex items-center rounded-md px-4 py-2 cursor-pointer"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
