import { useEffect, useState, type KeyboardEvent } from "react";

export function useDraft<StoredValue, WrittenValue = StoredValue>(
  value: StoredValue,
  parse: (raw: string) => WrittenValue | "refuse",
  onWrite: (value: WrittenValue) => void,
  format: (value: StoredValue | WrittenValue) => string = String,
) {
  const [draft, setDraft] = useState(() => format(value));

  useEffect(() => {
    setDraft(format(value));
  }, [format, value]);

  function commit() {
    const parsed = parse(draft);
    if (parsed === "refuse") {
      setDraft(format(value));
      return;
    }
    onWrite(parsed);
    setDraft(format(parsed));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      return;
    }
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    commit();
  }

  return { draft, setDraft, onBlur: commit, onKeyDown };
}
