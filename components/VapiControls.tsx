"use client";

import useVapi from "@/hooks/useVapi";
import { IBook } from "@/types";
import { Mic, MicOff } from "lucide-react";
import Image from "next/image";
import Transcript from "@/components/Transcript";

const VapiControls = ({ book }: { book: IBook }) => {
  const { title, author, coverURL, persona } = book;

  const {
    status,
    isActive,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    limitError,
    start,
    stop,
    clearError,
  } = useVapi(book);

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const statusLabel =
    status === "idle" ? "Ready" : status[0].toUpperCase() + status.slice(1);

  return (
    <>
      {limitError && (
        <div className="error-banner">
          <div className="error-banner-content">
            <span>{limitError}</span>
            <button type="button" onClick={clearError}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="vapi-header-card w-full">
        <div className="vapi-cover-wrapper">
          <Image
            src={coverURL}
            alt={title}
            width={120}
            height={180}
            className="vapi-cover-image"
          />
          <div className="vapi-mic-wrapper">
            <div className="relative inline-flex items-center justify-center">
              {(status === "thinking" || status === "speaking") && (
                <span className="absolute inset-0 rounded-full bg-white animate-ping" />
              )}
              <button
                onClick={isActive ? stop : start}
                disabled={status === "connecting" || status === "starting"}
                className={`vapi-mic-btn relative z-10 shadow-md w-15 h-15 ${
                  isActive ? "vapi-mic-btn-active" : "vapi-mic-btn-inactive"
                }`}
                type="button"
                aria-label="Toggle microphone"
              >
                {isActive ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-[#212a3b]" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <div>
            <h1 className="book-title-lg">{title}</h1>
            <p className="text-base text-[#3d485e] font-medium">by {author}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="vapi-status-indicator">
              <span className="vapi-status-dot vapi-status-dot-ready" />
              <span className="vapi-status-text">{statusLabel}</span>
            </div>
            <div className="vapi-status-indicator">
              <span className="vapi-status-text">
                Voice: {persona ?? "Default"}
              </span>
            </div>
            <div className="vapi-status-indicator">
              <span className="vapi-status-text">
                {formatDuration(duration)}/15:00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript area */}
      <div className="vapi-transcript-wrapper w-full">
        <Transcript
          messages={messages}
          currentMessage={currentMessage}
          currentUserMessage={currentUserMessage}
        />
      </div>
    </>
  );
};

export default VapiControls;
