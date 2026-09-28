"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, type Listing } from "@/lib/supabase";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_photos(id, url, sort_order)")
        .eq("id", id)
        .single();
      if (!cancelled) {
        if (error) console.error(error);
        setListing((data as Listing) || null);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="p-6 opacity-60">Loading…</p>;
  if (!listing) return <p className="p-6 opacity-60">Listing not found.</p>;

  const photos = [...(listing.listing_photos || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const digits = listing.contact.replace(/\D/g, "");
  const waNumber = "27" + digits.replace(/^0/, "");

  return (
    <main className="max-w-[560px] mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="text-sm opacity-60 hover:opacity-100 mb-4"
      >
        ← Back
      </button>

      <div className="flex justify-between items-start gap-4 mb-3">
        <h1 className="font-serif font-semibold text-[1.4rem] leading-tight">
          {listing.title}
        </h1>
      </div>

      {photos.length > 0 && (
        <div className="relative mb-4">
          <div
            className="gallery-track flex overflow-x-auto"
            onScroll={(e) => {
              const el = e.currentTarget;
              setActiveDot(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.url}
                alt=""
                className="flex-none w-full aspect-[16/10] object-cover bg-sand"
              />
            ))}
          </div>
          {photos.length > 1 && (
            <div className="flex justify-center gap-[0.4rem] mt-2">
              {photos.map((p, i) => (
                <span
                  key={p.id}
                  className={`w-[6px] h-[6px] rounded-full ${
                    i === activeDot ? "bg-teal" : "bg-line"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <span
        className={`inline-block text-[0.72rem] px-2 py-[0.2rem] rounded ${
          listing.verified ? "bg-teal text-white" : "bg-sand border border-line"
        }`}
      >
        {listing.verified ? "Verified" : "Unverified"}
      </span>
      <div className="font-serif text-[1.3rem] font-semibold mt-2 mb-1">
        R{listing.price.toLocaleString()}{" "}
        <small className="font-sans text-[0.75rem] font-normal opacity-65">/ month</small>
      </div>
      <div className="text-[0.85rem] opacity-75 mb-3">
        {listing.area} · {listing.type}
      </div>
      <p className="text-[0.95rem] opacity-90 mb-6">{listing.description}</p>

      <div className="flex flex-wrap gap-[0.7rem]">
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener"
          className="bg-teal text-white border border-teal rounded px-[1.1rem] py-[0.7rem] text-[0.9rem] font-medium"
        >
          Message on WhatsApp
        </a>
        <a
          href={`tel:+${waNumber}`}
          className="border border-line rounded px-[1.1rem] py-[0.7rem] text-[0.9rem] font-medium"
        >
          Call {listing.contact}
        </a>
      </div>

      <Link href="/" className="block mt-8 text-sm opacity-60 hover:opacity-100">
        ← Back to all listings
      </Link>
    </main>
  );
}
