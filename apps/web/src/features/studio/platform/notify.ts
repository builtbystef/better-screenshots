import { toast } from "sonner";

// Every line the Composition writers hand back is a refusal — `ok` is always
// null — so the one presentation this seam needs is the error toast. The id is
// the line itself, which keeps a refusal that repeats (a drag held against a
// bound, say) replacing its toast instead of stacking a column of copies.
export function notifyRefusal(line: string | null): void {
  if (line === null) {
    return;
  }
  toast.error(line, { id: line });
}
