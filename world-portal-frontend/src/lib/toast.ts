import { toast } from "sonner";

/**
 * A success toast with an Undo action, for reversible edits (WorldStreet's
 * "Saved — Undo" pattern). Undo toasts stay longer so there's time to act;
 * the timer pauses while hovered or focused (sonner's default).
 */
export function toastWithUndo(message: string, onUndo: () => void, label = "Undo") {
  return toast.success(message, {
    duration: 8000,
    action: { label, onClick: onUndo },
  });
}
