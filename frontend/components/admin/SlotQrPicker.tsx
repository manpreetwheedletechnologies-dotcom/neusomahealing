"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_QR = "/payments/webinar-upi.png";
const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 64 * 1024;

type Props = {
  image: string;
  onChange: (value: string) => void;
  onReadyChange: (ready: boolean) => void;
};

async function prepareQr(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Choose a PNG, JPG or WebP image.");
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Choose an image smaller than 5 MB.");
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const img = new Image();
    img.src = imageUrl;
    await img.decode();

    const originalSize = Math.max(img.naturalWidth, img.naturalHeight);
    const startSize = Math.min(originalSize, 720);
    const sizes = [startSize, ...[640, 512, 448, 384].filter(s => s < startSize)];

    for (const size of sizes) {
      const scale = size / originalSize;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Unable to process the QR image.");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const png = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (png && png.size <= MAX_OUTPUT_BYTES) {
        return canvas.toDataURL("image/png");
      }
    }

    throw new Error(
      "The resized QR still exceeds 64 KB. Crop around the QR, keep its white border, and upload again."
    );
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function SlotQrPicker({
  image,
  onChange,
  onReadyChange,
}: Props) {
  const [mode, setMode] = useState<"existing" | "upload">(
    image ? "upload" : "existing",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const version = useRef(0);

  useEffect(() => () => { version.current += 1; }, []);

  function selectMode(next: "existing" | "upload") {
    version.current += 1;
    setMode(next);
    setError("");
    setBusy(false);
    onChange("");
    onReadyChange(next === "existing");
  }

  async function selectFile(file?: File) {
    if (!file) return;

    const current = ++version.current;
    setBusy(true);
    setError("");
    onChange("");
    onReadyChange(false);

    try {
      const result = await prepareQr(file);
      if (version.current !== current) return;
      onChange(result);
      onReadyChange(true);
    } catch (err) {
      if (version.current !== current) return;
      setError(err instanceof Error ? err.message : "Unable to read the image.");
    } finally {
      if (version.current === current) setBusy(false);
    }
  }

  const preview = mode === "existing" ? DEFAULT_QR : image;

  return (
    <fieldset className="mt-4 rounded-xl border border-[#d9dfda] bg-white p-4">
      <legend className="px-1 text-sm font-semibold">Payment QR code</legend>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="slot-qr-source"
            checked={mode === "existing"}
            onChange={() => selectMode("existing")} />
          Use existing QR
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="slot-qr-source"
            checked={mode === "upload"}
            onChange={() => selectMode("upload")} />
          Upload a new QR
        </label>
      </div>

      {mode === "upload" && (
        <label className="mt-4 block text-sm">
          QR image for this session
          <input type="file" accept="image/png,image/jpeg,image/webp"
            className="mt-2 block w-full text-sm"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = "";
              void selectFile(file);
            }} />
        </label>
      )}

      {busy && <p role="status" className="mt-3 text-sm">Preparing preview…</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}

      {preview && (
        <figure className="mt-4">
          <img src={preview} alt="Payment QR for this session"
            className="h-44 w-44 rounded-lg border bg-white object-contain p-2" />
          <figcaption className="mt-2 text-xs text-[#617069]">
            Customers booking this session will see this QR.
          </figcaption>
        </figure>
      )}
    </fieldset>
  );
}