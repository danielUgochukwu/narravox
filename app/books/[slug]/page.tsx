import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { getBookBySlug } from "@/lib/actions/book.actions";
import { DEFAULT_VOICE, voiceOptions } from "@/constants";

type BookDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

const BookDetailsPage = async ({ params }: BookDetailsPageProps) => {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn();
  }

  const { slug } = await params;
  const bookResult = await getBookBySlug(slug);

  if (!bookResult.success || !bookResult.data) {
    redirect("/");
  }

  const { title, author, coverURL, persona } = bookResult.data;
  const voiceLabel = persona || voiceOptions[DEFAULT_VOICE].name;

  return (
    <main className="book-page-container">
      <Link href="/" className="back-btn-floating" aria-label="Back to library">
        <ArrowLeft className="h-5 w-5 text-[#212a3b]" aria-hidden="true" />
      </Link>

      <div className="vapi-main-container gap-5">
        <section className="vapi-header-card w-full">
          <div className="vapi-cover-wrapper">
            <Image
              src={coverURL}
              alt={`${title} cover`}
              width={120}
              height={180}
              className="vapi-cover-image !h-[180px] !w-[120px]"
              priority
            />

            <div className="vapi-mic-wrapper">
              <button
                type="button"
                className="vapi-mic-btn"
                aria-label="Start voice conversation"
              >
                <MicOff className="h-5 w-5 text-[#212a3b]" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold leading-tight text-[#212a3b] md:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-base font-medium text-[#3d485e]">
                by {author}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="vapi-status-indicator">
                <span
                  className="vapi-status-dot vapi-status-dot-ready"
                  aria-hidden="true"
                />
                <span className="vapi-status-text">Ready</span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">Voice: {voiceLabel}</span>
              </div>

              <div className="vapi-status-indicator">
                <span className="vapi-status-text">0:00/15:00</span>
              </div>
            </div>
          </div>
        </section>

        <section className="transcript-container min-h-[400px] shadow-soft-sm">
          <div className="transcript-empty">
            <Mic className="mb-5 h-12 w-12 text-[#212a3b]" aria-hidden="true" />
            <p className="transcript-empty-text">No conversation yet</p>
            <p className="transcript-empty-hint">
              Click the mic button above to start talking
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default BookDetailsPage;
