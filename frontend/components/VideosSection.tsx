"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { videos } from "@/lib/home-data";
import { heading, sectionPad, textLink } from "@/lib/home-styles";

function VideoCard({
  title,
  video,
  onOpen,
}: {
  title: string;
  video: string;
  onOpen: () => void;
}) {
  return (
    <Reveal>
      <div className="group block">
<div
  onClick={onOpen}
  className="relative h-[205px] w-full cursor-pointer overflow-hidden rounded-[14px] bg-[#112233]"
>
          <video
            src={video}
            preload="metadata"
            muted
            playsInline
            className="h-full w-full object-cover"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />

          {/* Play button */}
          <button
            type="button"
            aria-label={`Play ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="absolute left-1/2 top-1/2 z-[3] grid h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[16px] text-[#222] shadow-lg transition duration-300 group-hover:scale-110"
          >
            <span className="ml-[3px]">▶</span>
          </button>
        </div>

        <h3 className="mb-0 mt-[12px] font-serif text-[16px] font-medium leading-[1.15] text-[#151515]">
          {title}
        </h3>
      </div>
    </Reveal>
  );
}

function VideoModal({
  title,
  video,
  onClose,
}: {
  title: string;
  video: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    videoRef.current?.play().catch(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative h-[90vh] max-h-[760px] w-auto max-w-[92vw] overflow-hidden rounded-[16px] bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute right-[12px] top-[12px] z-[10] grid h-[36px] w-[36px] place-items-center rounded-full bg-black/60 text-[20px] text-white backdrop-blur-sm transition hover:bg-black/80"
        >
          ×
        </button>

        <video
          ref={videoRef}
          src={video}
          controls
          autoPlay
          playsInline
          className="h-full w-auto max-w-[92vw] object-contain"
        />
      </div>
    </div>
  );
}

export function VideosSection() {
  const [selectedVideo, setSelectedVideo] = useState<{
    title: string;
    video: string;
  } | null>(null);

  return (
    <section className={`bg-[#faf6ee] ${sectionPad}`}>
      <div className="mx-auto max-w-[1180px]">
        <div className="grid grid-cols-[300px_1fr] items-center gap-[32px] max-[1000px]:grid-cols-1">

          {/* LEFT */}
          <Reveal>
            <div>
              <h2
                className={`${heading} !mb-[16px] !text-[48px] !leading-[1.08]`}
              >
                Watch.
                <br />
                <i className="italic">Reflect.</i>
                <br />
                Discover.
              </h2>

              <p className="mb-[24px] max-w-[270px] text-[13px] leading-[1.55] text-[#5e5952]">
                Explore videos to understand, learn and support your
                transformation.
              </p>

              <a
                className={`${textLink} inline-flex items-center gap-[14px] rounded-full border border-[#ddc6a5] px-[24px] py-[11px] text-[11px]`}
                href="/videos"
              >
                View All Videos

                <span className="grid h-[25px] w-[25px] place-items-center rounded-full border border-[#ddc6a5]">
                  →
                </span>
              </a>
            </div>
          </Reveal>

          {/* ONLY 2 VIDEOS */}
<div className="grid grid-cols-4 gap-[24px] max-[900px]:grid-cols-2 max-[550px]:grid-cols-1">
  {videos.map((video) => (
    <VideoCard
      key={video.title}
      title={video.title}
      video={video.video}
      onOpen={() => setSelectedVideo(video)}
    />
  ))}
</div>
        </div>
      </div>

      {/* VIDEO POPUP */}
      {selectedVideo && (
        <VideoModal
          title={selectedVideo.title}
          video={selectedVideo.video}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </section>
  );
}