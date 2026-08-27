import { exportLine } from "@/features/studio/composition/messages";
import type { StudioSession } from "@/features/studio/composition/session";
import { notifyRefusal } from "@/features/studio/platform/notify";
import { useState } from "react";

export function useExport(session: StudioSession) {
  const [exporting, setExporting] = useState(false);

  async function exportPng() {
    setExporting(true);
    try {
      const result = await session.exportPng(new Date());
      notifyRefusal(exportLine(result === "refuse" ? "refuse" : "ok"));
      if (result === "refuse") {
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportPng };
}
