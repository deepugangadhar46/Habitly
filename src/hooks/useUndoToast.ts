import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UndoToastOptions {
  message: string;
  duration?: number;
  onUndo: () => void | Promise<void>;
  onComplete?: () => void;
}

export function useUndoToast() {
  const [isUndoing, setIsUndoing] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoCallbackRef = useRef<(() => void | Promise<void>) | null>(null);

  const showUndoToast = useCallback(({ message, duration = 3000, onUndo, onComplete }: UndoToastOptions) => {
    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    undoCallbackRef.current = onUndo;

    // Show toast with undo button
    toast(message, {
      duration,
      action: {
        label: 'Undo',
        onClick: async () => {
          if (undoCallbackRef.current) {
            setIsUndoing(true);
            try {
              await undoCallbackRef.current();
              toast.success('Undone! 🔄');
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error('Undo failed:', error);
              }
              toast.error('Undo failed. Please try again.');
            } finally {
              setIsUndoing(false);
              undoCallbackRef.current = null;
              if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
              }
            }
          }
        },
      },
    });

    // Auto-complete after duration
    undoTimeoutRef.current = setTimeout(() => {
      undoCallbackRef.current = null;
      onComplete?.();
    }, duration);
  }, []);

  const cancelUndo = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    undoCallbackRef.current = null;
  }, []);

  return {
    showUndoToast,
    cancelUndo,
    isUndoing,
  };
}
