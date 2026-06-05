import { z } from "zod";

export const UploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  persona: z.string().optional(),
  pdfFile: z
    .instanceof(File, { message: "PDF file is required" })
    .refine((file) => file.type === "application/pdf", {
      message: "File must be a PDF",
    })
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: "PDF must be less than 50MB",
    }),
  coverImage: z
    .instanceof(File)
    .refine((file) => file.type.startsWith("image/"), {
      message: "File must be an image",
    })
    .optional(),
});
