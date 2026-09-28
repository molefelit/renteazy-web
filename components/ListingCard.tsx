"use client";

import Link from "next/link";
import type { Listing } from "@/lib/supabase";

export default function ListingCard({ listing }: { listing: Listing }) {
  const photos = [...(listing.listing_photos || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`block border border-line ${
        listing.verified ? "border-l-[3px] border-l-teal" : "border-l-[3px] border-l-line"
      } bg-paper p-[1.1rem] relative hover:opacity-95 transition-opacity`}
    >
      {photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photos[0].url}
          alt=""
          className="w-[calc(100%+2.2rem)] -mx-[1.1rem] -mt-[1.1rem] mb-[0.9rem] block aspect-[4/3] object-cover bg-sand"
        />
      )}
      {photos.length > 1 && (
        <span className="absolute top-[0.7rem] right-[0.7rem] bg-black/65 text-white text-[0.72rem] px-2 py-[0.15rem] rounded">
          1 / {photos.length}
        </span>
      )}
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-serif font-semibold text-[1.05rem] leading-tight">
          {listing.title}
        </h3>
        <span
          className={`text-[0.72rem] px-2 py-[0.2rem] rounded whitespace-nowrap flex-none ${
            listing.verified ? "bg-teal text-white" : "bg-sand border border-line"
          }`}
        >
          {listing.verified ? "Verified" : "Unverified"}
        </span>
      </div>
      <div className="font-serif text-[1.3rem] font-semibold mt-2 mb-[0.2rem]">
        R{listing.price.toLocaleString()}{" "}
        <small className="font-sans text-[0.75rem] font-normal opacity-65">/ month</small>
      </div>
      <div className="text-[0.85rem] opacity-75 mb-[0.6rem]">
        {listing.area} · {listing.type}
      </div>
      <div className="text-[0.88rem] opacity-85 line-clamp-2">{listing.description}</div>
    </Link>
  );
}
