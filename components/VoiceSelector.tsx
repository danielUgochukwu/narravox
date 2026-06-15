"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { voiceOptions, voiceCategories } from "@/constants";
import { VoiceSelectorProps } from "@/types";

const categoryLabels: Record<keyof typeof voiceCategories, string> = {
  male: "Male Voices",
  female: "Female Voices",
};

const VoiceSelector = ({
  value,
  onChange,
  disabled,
  className,
}: VoiceSelectorProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(voiceCategories).map(([category, keys]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-[#3d485e] mb-2 uppercase tracking-wider">
            {categoryLabels[category as keyof typeof voiceCategories]}
          </h4>
          <div className="voice-selector-options flex-wrap">
            {keys.map((key) => {
              const voice = voiceOptions[key as keyof typeof voiceOptions];
              const isSelected = value === voice.id;

              return (
                <div
                  key={key}
                  role="radio"
                  tabIndex={disabled ? -1 : 0}
                  aria-checked={isSelected}
                  aria-disabled={disabled}
                  onClick={() => !disabled && onChange(voice.id)}
                  onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange(voice.id);
                    }
                  }}
                  className={cn(
                    "voice-selector-option flex-col items-start! p-4",
                    isSelected
                      ? "voice-selector-option-selected"
                      : "voice-selector-option-default",
                    disabled && "voice-selector-option-disabled"
                  )}
                >
                  <span className="font-bold text-[#212a3b]">
                    {voice.name}
                  </span>
                  <span className="text-sm text-[#3d485e]">
                    {voice.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VoiceSelector;
