"use client";

import { useRef, useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadSchema } from "@/lib/zod";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { BookUploadFormValues } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  checkBookExists,
  createBook,
  saveBookSegments,
} from "@/lib/actions/book.actions";
import { useRouter } from "next/navigation";
import { parsePDFFile } from "@/lib/utils";
import { upload } from "@vercel/blob/client";

const voices = {
  male: [
    { name: "Dave", description: "Deep & authoritative" },
    { name: "Daniel", description: "Warm & conversational" },
    { name: "Chris", description: "Professional & clear" },
  ],
  female: [
    { name: "Rachel", description: "Bright & energetic" },
    { name: "Sarah", description: "Calm & soothing" },
  ],
};

export default function UploadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuth();
  const router = useRouter();

  const form = useForm<BookUploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: "",
      pdfFile: undefined,
      coverImage: undefined,
    },
  });

  const onSubmit = async (data: BookUploadFormValues) => {
    if (!userId) {
      return toast.error("Please login to upload books.");
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    // PostHog → Track Book Uploads ...

    try {
      const existsCheck = await checkBookExists(data.title);

      if (existsCheck.exists && existsCheck.book) {
        toast.info("Book with same title already exists.");
        form.reset();
        router.push(`/books/${existsCheck.book.slug}`);
        return;
      }

      const fileTitle = data.title.replace(/\s+/g, "-").toLowerCase();
      const pdfFile = data.pdfFile;

      const parsedPDF = await parsePDFFile(pdfFile);

      if (parsedPDF.content.length === 0) {
        toast.error(
          "Failed to parse PDF. Please try again with a different file."
        );
        return;
      }

      const uploadedPdfBlob = await upload(fileTitle, pdfFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: "application/pdf",
      });

      let coverUrl: string;

      if (data.coverImage) {
        const coverFile = data.coverImage;
        const uploadedCoverBlob = await upload(
          `${fileTitle}_cover.png`,
          coverFile,
          {
            access: "public",
            handleUploadUrl: "/api/upload",
            contentType: coverFile.type,
          }
        );
        coverUrl = uploadedCoverBlob.url;
      } else {
        const response = await fetch(parsedPDF.cover);
        const blob = await response.blob();

        const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: "image/png",
        });
        coverUrl = uploadedCoverBlob.url;
      }

      const book = await createBook({
        clerkId: userId,
        title: data.title,
        author: data.author,
        persona: data.persona,
        fileURL: uploadedPdfBlob.url,
        fileBlobKey: uploadedPdfBlob.pathname,
        coverURL: coverUrl,
        fileSize: pdfFile.size,
      });

      if (!book.success) {
        toast.error("Failed to create book. Please try again later.");
        throw new Error("Failed to create book");
        return;
      }

      if (existsCheck.exists && existsCheck.book) {
        toast.info("Book with same title already exists.");
        form.reset();
        router.push(`/books/${existsCheck.book.slug}`);
        return;
      }

      const segments = await saveBookSegments(
        book.data.id,
        userId,
        parsedPDF.content
      );

      if (!segments.success) {
        toast.error("Failed to save book segments. Please try again later.");
        throw new Error("Failed to save book segments");
      }

      form.reset();
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload book. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log(data);
    setIsSubmitting(false);
  };

  return (
    <div className="new-book-wrapper relative">
      {isSubmitting && (
        <div className="loading-wrapper">
          <div className="loading-shadow-wrapper bg-white">
            <div className="loading-shadow">
              <Loader2 className="loading-animation w-12 h-12 text-[#663820]" />
              <h2 className="loading-title">Synthesizing Book...</h2>
              <div className="loading-progress">
                <div className="loading-progress-item">
                  <span className="loading-progress-status"></span>
                  <span>Extracting text from PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <fieldset>
            {/* PDF Upload */}
            <Controller
              control={form.control}
              name="pdfFile"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <label className="form-label">Upload Book PDF</label>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        field.onChange(file);
                      }
                      e.target.value = "";
                    }}
                  />
                  <div
                    className={`upload-dropzone border-2 border-dashed border-[#d4c4a8] ${
                      field.value
                        ? "upload-dropzone-uploaded border-transparent"
                        : ""
                    }`}
                    onClick={() => {
                      pdfInputRef.current?.click();
                    }}
                  >
                    {field.value ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <span className="upload-dropzone-text font-bold text-[#212a3b]">
                            {(field.value as File).name || "Selected PDF"}
                          </span>
                          <div
                            className="upload-dropzone-remove"
                            role="button"
                            tabIndex={0}
                            aria-label="Remove selected PDF"
                            onClick={(e) => {
                              e.stopPropagation();
                              field.onChange(undefined);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                field.onChange(undefined);
                              }
                            }}
                          >
                            <X className="w-5 h-5" />
                          </div>
                        </div>
                        <span className="upload-dropzone-hint">
                          Click to change file
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="upload-dropzone-icon" />
                        <span className="upload-dropzone-text">
                          Click to upload PDF
                        </span>
                        <span className="upload-dropzone-hint">
                          PDF file (max 50MB)
                        </span>
                      </div>
                    )}
                  </div>
                  {fieldState.error && (
                    <p className="text-red-500 text-sm">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Cover Image Upload */}
            <Controller
              control={form.control}
              name="coverImage"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <label className="form-label">Upload Book Cover Image</label>
                  <div
                    className={`upload-dropzone border-2 border-dashed border-[#d4c4a8] ${
                      field.value
                        ? "upload-dropzone-uploaded border-transparent"
                        : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload book cover image"
                    onClick={() => {
                      if (!field.value) {
                        field.onChange(new File([""], "cover.jpg"));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!field.value) {
                          field.onChange(new File([""], "cover.jpg"));
                        }
                      }
                    }}
                  >
                    {field.value ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <span className="upload-dropzone-text font-bold text-[#212a3b]">
                            {(field.value as File).name || "Selected Cover"}
                          </span>
                          <div
                            className="upload-dropzone-remove"
                            role="button"
                            aria-label="Remove selected cover image"
                            onClick={(e) => {
                              e.stopPropagation();
                              field.onChange(undefined);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                field.onChange(undefined);
                              }
                            }}
                          >
                            <X className="w-5 h-5" />
                          </div>
                        </div>
                        <span className="upload-dropzone-hint">
                          Click to change image
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="upload-dropzone-icon" />
                        <span className="upload-dropzone-text">
                          Click to upload cover image
                        </span>
                        <span className="upload-dropzone-hint">
                          Leave empty to auto-generate from PDF
                        </span>
                      </div>
                    )}
                  </div>
                  {fieldState.error && (
                    <p className="text-red-500 text-sm">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Title */}
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <label className="form-label">Title</label>
                  <input
                    {...field}
                    className="form-input"
                    placeholder="ex: Rich Dad Poor Dad"
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Author */}
            <Controller
              control={form.control}
              name="author"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <label className="form-label">Author Name</label>
                  <input
                    {...field}
                    className="form-input"
                    placeholder="ex: Robert Kiyosaki"
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Voice Selector */}
            <Controller
              control={form.control}
              name="persona"
              render={({ field }) => (
                <div className="space-y-4">
                  <label className="form-label">Choose Assistant Voice</label>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-[#3d485e] mb-2 uppercase tracking-wider">
                        Male Voices
                      </h4>
                      <div className="voice-selector-options flex-wrap">
                        {voices.male.map((voice) => (
                          <div
                            key={voice.name}
                            role="radio"
                            tabIndex={0}
                            aria-checked={field.value === voice.name}
                            onClick={() => field.onChange(voice.name)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                field.onChange(voice.name);
                              }
                            }}
                            className={`voice-selector-option flex-col items-start! p-4 ${
                              field.value === voice.name
                                ? "voice-selector-option-selected"
                                : "voice-selector-option-default"
                            }`}
                          >
                            <span className="font-bold text-[#212a3b]">
                              {voice.name}
                            </span>
                            <span className="text-sm text-[#3d485e]">
                              {voice.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-[#3d485e] mb-2 uppercase tracking-wider">
                        Female Voices
                      </h4>
                      <div className="voice-selector-options flex-wrap">
                        {voices.female.map((voice) => (
                          <div
                            key={voice.name}
                            role="radio"
                            tabIndex={0}
                            aria-checked={field.value === voice.name}
                            onClick={() => field.onChange(voice.name)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                field.onChange(voice.name);
                              }
                            }}
                            className={`voice-selector-option flex-col items-start! p-4 ${
                              field.value === voice.name
                                ? "voice-selector-option-selected"
                                : "voice-selector-option-default"
                            }`}
                          >
                            <span className="font-bold text-[#212a3b]">
                              {voice.name}
                            </span>
                            <span className="text-sm text-[#3d485e]">
                              {voice.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            />
          </fieldset>

          <button type="submit" className="form-btn" disabled={isSubmitting}>
            Begin Synthesis
          </button>
        </form>
      </FormProvider>
    </div>
  );
}
