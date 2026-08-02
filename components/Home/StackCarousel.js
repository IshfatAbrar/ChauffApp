"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

const slides = [
  {
    src: "/chauffbanner.jpeg",
    objectPosition: "center center",
    headline: "Career chauffeurs for the\nworld’s busiest schedules.",
    caption: "EXECUTIVE FLEET",
  },
  {
    src: "/travel.jpeg",
    objectPosition: "center 45%",
    headline: "See the city with a professional\nbehind the wheel.",
    caption: "CHAUFFEURED TOURS",
  },
  {
    src: "/event.png",
    objectPosition: "center center",
    headline: "Arrive at tonight’s events\nwith chauffeured ease.",
    caption: "EVENTS",
  },
];

/**
 * Atlas-style sticky stack:
 * - Each panel is 170lvh tall with a 100lvh sticky child
 * - Earlier panels ease down (0→25%) as the next covers them
 * - Labels fade/parallax around their focus scroll position
 */
export default function StackCarousel() {
  const [active, setActive] = useState(0);
  const panelRefs = useRef([]);
  const labelRefs = useRef([]);
  const pictureRefs = useRef([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const panels = panelRefs.current.filter(Boolean);
    const labels = labelRefs.current.filter(Boolean);
    if (!panels.length) return;

    // Absolute Y anchors — measured once like Atlas (DOMContentLoaded)
    const panelBottoms = panels.map((el) => {
      const { height, top } = el.getBoundingClientRect();
      return window.scrollY + top + height;
    });

    const labelAnchors = labels.map((el) => {
      const { top } = el.getBoundingClientRect();
      return window.scrollY + top;
    });

    const tick = () => {
      const sy = window.scrollY;
      const vh = window.innerHeight;

      // Stack translate on all but the last panel
      panels.forEach((el, i) => {
        if (i === panels.length - 1) {
          el.style.translate = "0 0";
          return;
        }
        const y = Math.max(0, Math.min(25, 0.02 * (sy + vh - panelBottoms[i])));
        el.style.translate = `0 ${y}%`;
      });

      // Label opacity + parallax — wider window so copy shows earlier & longer
      labels.forEach((el, i) => {
        // Peak slightly before the natural anchor so text arrives sooner
        const o = labelAnchors[i] - 180;
        const opacity = Math.max(0, Math.min(1, -6e-7 * (sy - o) ** 2 + 1));
        const ty = Math.max(-80, Math.min(80, (o - sy) * 0.08));
        el.style.opacity = String(opacity);
        el.style.translate = `0 ${ty}px`;
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    const onResize = () => {
      panels.forEach((el, i) => {
        const prev = el.style.translate;
        el.style.translate = "0 0";
        const { height, top } = el.getBoundingClientRect();
        panelBottoms[i] = window.scrollY + top + height;
        el.style.translate = prev;
      });
      labels.forEach((el, i) => {
        const prev = el.style.translate;
        el.style.translate = "0 0";
        const { top } = el.getBoundingClientRect();
        labelAnchors[i] = window.scrollY + top;
        el.style.translate = prev;
      });
      tick();
    };

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Pagination follows picture visibility (Atlas)
  useEffect(() => {
    const nodes = pictureRefs.current.filter(Boolean);
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.getAttribute("data-order"));
          if (!Number.isNaN(idx)) setActive(idx);
        });
      },
      { threshold: 0.5 },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative bg-void" aria-label="Experiences">
      {/* Pagination sits first in DOM like Atlas, absolute over the stack */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-[9] flex justify-end"
        style={{
          margin: "calc(-2rem + 50lvh) 0",
        }}
        aria-hidden="true"
      >
        <div
          className="sticky mr-4 flex h-16 w-6 flex-col items-center justify-between rounded-xl py-3 md:mr-8"
          style={{
            top: "calc(-2rem + 50lvh)",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {slides.map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-lg transition-colors duration-300 ease-in-out"
              style={{
                backgroundColor:
                  i === active
                    ? "rgb(255, 255, 255)"
                    : "rgba(255, 255, 255, 0.24)",
              }}
            />
          ))}
        </div>
      </div>

      {slides.map((slide, i) => (
        <div
          key={slide.caption}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          className="relative h-[170lvh] will-change-transform"
        >
          <div className="sticky top-0 h-[100lvh] w-full">
            <div
              ref={(el) => {
                pictureRefs.current[i] = el;
              }}
              data-order={i}
              className="relative h-full w-full"
            >
              <Image
                src={slide.src}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: slide.objectPosition }}
                priority={i === 0}
              />
              {/* Dim image so white copy stays readable */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.42)" }}
              />
            </div>

            {/* Label — scroll-driven opacity */}
            <div
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className="absolute top-[47%] z-20 w-full px-8 will-change-[opacity,transform]"
              style={{ opacity: 0 }}
            >
              <div className="mx-auto w-full text-center md:w-[900px]">
                <h2 className="mb-5 whitespace-pre-wrap font-display text-[24px] font-normal leading-[1.15] tracking-[-0.02em] text-paper md:text-[42px] md:leading-[1.05]">
                  {slide.headline}
                </h2>
                <p className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-frost md:text-[12px]">
                  {slide.caption}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
