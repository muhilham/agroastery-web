"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { Thumb } from "./thumb";
import Image from "next/image";

type ImageItem = { image: string; alt?: string } | string;

type PropType = {
  images: ImageItem[];
  options?: EmblaOptionsType;
  fallbackAlt?: string;
};

export const EmblaCarousel: React.FC<PropType> = ({
  images,
  options,
  fallbackAlt = "product",
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel(options);
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const slides = useMemo(() => {
    const list = (images ?? []).map((it) =>
      typeof it === "string"
        ? { src: it, alt: fallbackAlt }
        : { src: it.image, alt: it.alt ?? fallbackAlt },
    );
    return list.length
      ? list
      : [{ src: "/assets/coffe/blend-gayo.png", alt: fallbackAlt }];
  }, [images, fallbackAlt]);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    const snap = emblaMainApi.selectedScrollSnap();
    setSelectedIndex(snap);
    emblaThumbsApi.scrollTo(snap);
  }, [emblaMainApi, emblaThumbsApi]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on("select", onSelect).on("reInit", onSelect);
  }, [emblaMainApi, onSelect]);

  return (
    <div className="embla desktop:max-w-[360px] block">
      <div className="embla__viewport" ref={emblaMainRef}>
        <div className="embla__container">
          {slides.map((item, index) => (
            <div className="embla__slide bg-[#242424] relative" key={index}>
              <div className="relative w-full aspect-square">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width:768px) 100vw, 360px"
                  priority={index === 0}
                />
              </div>
              <div className="text-primary border rounded-xl fixed left-10 text-xs bottom-5 border-primary px-4 py-1">
                {index + 1}/{slides.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="embla-thumbs">
        <div className="embla-thumbs__viewport" ref={emblaThumbsRef}>
          <div className="inline-flex items-center gap-2 p-4 desktop:p-0 w-full">
            {slides.map((item, index) => (
              <Thumb
                key={index}
                onClick={() => onThumbClick(index)}
                selected={index === selectedIndex}
                src={item.src}
                alt={item.alt}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmblaCarousel;
