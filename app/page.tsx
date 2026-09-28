"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase, type Listing } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_photos(id, url, sort_order)")
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (error) console.error(error);
        setListings((data as Listing[]) || []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const areas = useMemo(
    () => [...new Set(listings.map((l) => l.area))].sort(),
    [listings]
  );
  const types = useMemo(
    () => [...new Set(listings.map((l) => l.type))].sort(),
    [listings]
  );

  const results = listings.filter((l) => {
    if (area && l.area !== area) return false;
    if (type && l.type !== type) return false;
    if (verifiedOnly && !l.verified) return false;
    if (budget) {
      const [lo, hi] = budget.split("-").map(Number);
      if (l.price < lo || l.price > hi) return false;
    }
    if (query) {
      const q = query.toLowerCase();
      if (!(l.title + l.area + l.description).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <main>
      <header className="pt-[2.2rem] pb-[1.6rem] px-6 border-b border-line">
        <div className="max-w-[920px] mx-auto">
          <div className="flex items-baseline gap-2 mb-[0.9rem]">
            <span className="w-[10px] h-[10px] bg-brick rounded-full" />
            <span className="font-serif font-semibold text-[1.1rem]">RentEazy</span>
          </div>
          <h1 className="font-serif font-semibold text-[clamp(1.6rem,4vw,2.3rem)] max-w-[20ch]">
            Find a room, not a runaround.
          </h1>
          <p className="mt-[0.6rem] max-w-[52ch] opacity-80 text-[0.98rem]">
            Listings around Soweto, checked for the things that waste your weekends.
          </p>
        </div>
      </header>

      <nav className="flex gap-1 px-6 max-w-[920px] mx-auto border-b border-line">
        <span className="text-[0.9rem] font-medium py-[0.9rem] mr-5 border-b-2 border-brick">
          Browse rooms
        </span>
        <Link
          href="/list-a-room"
          className="text-[0.9rem] font-medium py-[0.9rem] mr-5 opacity-55 hover:opacity-100"
        >
          List your room
        </Link>
      </nav>

      <div className="flex flex-wrap gap-2 p-6 max-w-[920px] mx-auto sticky top-0 bg-paper z-10 border-b border-line md:border-b-0">
        <input
          type="text"
          placeholder="Search by area or keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[12rem] text-base px-3 py-[0.6rem] border border-line rounded bg-sand"
        />
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="text-base px-3 py-[0.6rem] border border-line rounded bg-sand min-w-[9rem]"
        >
          <option value="">Any area</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="text-base px-3 py-[0.6rem] border border-line rounded bg-sand min-w-[9rem]"
        >
          <option value="">Any budget</option>
          <option value="0-1500">Under R1,500</option>
          <option value="1500-2500">R1,500 – R2,500</option>
          <option value="2500-4000">R2,500 – R4,000</option>
          <option value="4000-99999">R4,000+</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-base px-3 py-[0.6rem] border border-line rounded bg-sand min-w-[9rem]"
        >
          <option value="">Any room type</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="px-6 pb-4 max-w-[920px] mx-auto">
        <button
          onClick={() => setVerifiedOnly((v) => !v)}
          aria-pressed={verifiedOnly}
          className={`border border-line rounded-full px-[0.85rem] py-[0.4rem] text-[0.85rem] ${
            verifiedOnly ? "bg-teal border-teal text-white" : ""
          }`}
        >
          Verified listings only
        </button>
      </div>

      <p className="px-6 max-w-[920px] mx-auto text-[0.85rem] opacity-65 pt-2">
        {loading ? "Loading…" : `${results.length} room${results.length === 1 ? "" : "s"} found`}
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[1.1rem] p-6 max-w-[920px] mx-auto">
        {results.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
      {!loading && results.length === 0 && (
        <p className="text-center opacity-60 max-w-[920px] mx-auto py-12 px-6">
          No rooms match those filters yet. Try widening your budget or area.
        </p>
      )}
    </main>
  );
}
