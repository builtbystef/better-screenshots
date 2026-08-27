import { useEffect, useState } from "react";

export function ImageThumbnail({ blob }: { blob: Blob }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  if (src === "") {
    return <span className="block aspect-square w-full bg-muted" />;
  }
  return <img src={src} alt="" className="block aspect-square w-full object-cover" />;
}
