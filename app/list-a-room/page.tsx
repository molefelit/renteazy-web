"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ROOM_TYPES = ["Backroom", "Shared room", "Full house room", "Cottage"];
const MAX_PHOTOS = 6;
const MAX_DIMENSION = 1600; // longest side in pixels
const JPEG_QUALITY = 0.8;

// Shrinks big phone photos before upload so they don't eat up storage.
// If anything goes wrong (unsupported format, etc.), it falls back to the
// original file, so a photo is never lost because of this step.
async function shrinkImage(
  file: File
): Promise<{ blob: Blob; ext: string; type: string }> {
  const original = {
    blob: file as Blob,
    ext: (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg",
    type: file.type || "image/jpeg",
  };
  if (file.type === "image/gif") return original; // resizing would flatten the animation

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.fillStyle = "#ffffff"; // so transparent PNGs don't turn black
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    // Only use the shrunk version if it's actually smaller.
    if (!blob || blob.size >= file.size) return original;
    return { blob, ext: "jpg", type: "image/jpeg" };
  } catch {
    return original;
  }
}

export default function ListARoomPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    title: "",
    area: "",
    type: ROOM_TYPES[0],
    price: "",
    description: "",
    contact: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Build thumbnail URLs for the chosen files, and clean them up afterwards.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function handleFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length) {
      // Add to what's already chosen instead of replacing it.
      setFiles((prev) => [...prev, ...chosen].slice(0, MAX_PHOTOS));
    }
    e.target.value = ""; // lets you pick the same file again if you remove it
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("Saving listing…");

    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        title: form.title.trim(),
        area: form.area.trim(),
        type: form.type,
        price: Number(form.price),
        description: form.description.trim(),
        contact: form.contact.trim(),
        verified: false,
      })
      .select()
      .single();

    if (error || !listing) {
      console.error(error);
      setStatus("Couldn't save that listing — try again.");
      setSubmitting(false);
      return;
    }

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        setStatus(`Uploading photo ${i + 1}/${files.length}…`);
        const { blob, ext, type } = await shrinkImage(files[i]);
        const path = `${listing.id}/${Date.now()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(path, blob, { contentType: type });
        if (uploadError) {
          console.error(uploadError);
          continue; // skip a failed file rather than blocking the rest
        }
        const { data: publicUrl } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(path);
        await supabase.from("listing_photos").insert({
          listing_id: listing.id,
          url: publicUrl.publicUrl,
          sort_order: i,
        });
      }
    }

    setStatus("Listing added.");
    router.push(`/listings/${listing.id}`);
  }

  return (
    <main className="max-w-[560px] mx-auto p-6">
      <h1 className="font-serif font-semibold text-[1.5rem] mb-1">List your room</h1>
      <p className="opacity-75 text-[0.95rem] mb-6">
        Takes two minutes. Your listing goes up as <strong>unverified</strong> until
        we check it — that part's coming soon.
      </p>

      <form onSubmit={handleSubmit} className="space-y-[1.1rem]">
        <Field label="Listing title">
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Backroom near Jabulani Mall"
            className="w-full text-base px-3 py-[0.65rem] border border-line rounded bg-sand"
          />
        </Field>

        <div className="flex flex-col sm:flex-row gap-[0.8rem]">
          <div className="flex-1">
            <Field label="Area">
              <input
                required
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="e.g. Jabulani"
                className="w-full text-base px-3 py-[0.65rem] border border-line rounded bg-sand"
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Room type">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full text-base px-3 py-[0.65rem] border border-line rounded bg-sand"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <Field label="Monthly rent (R)">
          <input
            required
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="e.g. 1800"
            className="w-full text-base px-3 py-[0.65rem] border border-line rounded bg-sand"
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's included, what it's near, who it suits…"
            className="w-full text-base px-3 py-[0.65rem] border border-line rounded bg-sand min-h-[5rem]"
          />
        </Field>

        <Field label="Contact number">
          <input
            required
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="e.g. 082 123 4567"
            className="w-full text-base px-3 py-[0.65rem] border border-line rounded bg-sand"
          />
        </Field>

        <Field label="Photos (optional)">
          <div className="flex items-center gap-3 flex-wrap">
            {files.length < MAX_PHOTOS && (
              <label className="inline-block border border-line rounded px-[1.1rem] py-[0.7rem] text-[0.9rem] font-medium cursor-pointer bg-sand">
                {files.length ? "Add more photos" : "Choose photos"}
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFilesChosen}
                  className="hidden"
                />
              </label>
            )}
            <span className="text-[0.85rem] opacity-65">
              {files.length} of {MAX_PHOTOS} photos
              {files.length > 1 ? " · the first one is the cover" : ""}
            </span>
          </div>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {previews.map((src, i) => (
                <div key={src} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="w-full aspect-square object-cover bg-sand rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-7 h-7 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="bg-teal text-white border border-teal rounded px-[1.1rem] py-[0.7rem] text-[0.9rem] font-medium disabled:opacity-60"
        >
          {submitting ? status || "Adding…" : "Add listing"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.85rem] font-medium mb-[0.35rem]">{label}</label>
      {children}
    </div>
  );
}
