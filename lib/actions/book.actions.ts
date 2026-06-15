"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

export const getAllBooks = async () => {
  try {
    await connectToDatabase();

    const books = await Book.find().sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: serializeData(books),
    };
  } catch (error) {
    console.error("Error connecting to database", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch books",
    };
  }
};

export const getBookBySlug = async (slug: string) => {
  try {
    await connectToDatabase();

    const book = await Book.findOne({ slug })
      .select("title author coverURL persona")
      .lean();

    if (!book) {
      return {
        success: false,
        data: null,
      };
    }

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (error) {
    console.error("Error fetching book by slug:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch book",
    };
  }
};

export const checkBookExists = async (title: string) => {
  try {
    await connectToDatabase();

    const slug = generateSlug(title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        exists: true,
        book: serializeData(existingBook),
      };
    }

    return {
      exists: false,
    };
  } catch (error) {
    console.error("Error checking if book exists:", error);
    throw error;
  }
};

export const createBook = async (data: CreateBook) => {
  try {
    await connectToDatabase();

    const slug = generateSlug(data.title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true,
      };
    }

    // Todo: Check limits before creating a new book

    const book = await Book.create({ ...data, slug, totalSegments: 0 });

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (error) {
    console.error("Error creating book:", error);

    return {
      success: false,
      error: error,
    };
  }
};

export const saveBookSegments = async (
  bookId: string,
  clerkId: string,
  segments: TextSegment[]
) => {
  try {
    await connectToDatabase();

    console.log("Saving book segments...");

    const segmentsToInsert = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        clerkId,
        bookId,
        content: text,
        segmentIndex,
        pageNumber,
        wordCount,
      })
    );

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await BookSegment.insertMany(segmentsToInsert, { session });
        await Book.findByIdAndUpdate(
          bookId,
          { totalSegments: segments.length },
          { session }
        );
      });
    } catch (e) {
      console.error("Error saving book segments", e);

      try {
        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up database after segment save failure",
          cleanupError
        );
      }

      return {
        success: false,
        error: e instanceof Error ? e.message : "Failed to save book segments",
      };
    } finally {
      await session.endSession();
    }

    console.log("Book segments saved successfully.");

    return {
      success: true,
      data: { segmentsCreated: segments.length },
    };
  } catch (e) {
    console.error("Error saving book segments", e);

    return {
      success: false,
      error: e,
    };
  }
};
