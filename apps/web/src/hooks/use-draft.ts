import { useEffect, useState, type KeyboardEvent } from "react";
import { commitDraft } from "../parse";

export function useDraft<StoredValue, WrittenValue = StoredValue>(
  value: StoredValue,
  format: (value: StoredValue | WrittenValue) => string,
  parse: (raw: string) => WrittenValue | "refuse",
  onWrite: (value: WrittenValue) => void,
) {
  const [draft, setDraft] = useState(format(value));

  useEffect(() => {
    setDraft(format(value));
  }, [format, value]);

  function commit() {
    const outcome = commitDraft(draft, value, parse, format);
    if ("revert" in outcome) {
      setDraft(outcome.revert);
      return;
    }
    onWrite(outcome.write);
    setDraft(format(outcome.write));
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
