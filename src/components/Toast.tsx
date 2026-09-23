import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="milestone-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

/** Global toast hook */
export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  const show = (message: string) => {
    setToast(message);
  };

  const clear = () => setToast(null);

  return { toast, show, clear };
}
