import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { getBookBySlug } from "@/lib/actions/book.actions";
import VapiControls from "@/components/VapiControls";

interface Props {
  params: Promise<{ slug: string }>;
}

const Page = async ({ params }: Props) => {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { slug } = await params;
  const result = await getBookBySlug(slug);

  if (!result.success || !result.data) redirect("/");

  return (
    <main className="book-page-container">
      <Link href="/" className="back-btn-floating">
        <ArrowLeft className="w-5 h-5 text-[#212a3b]" />
      </Link>

      <div className="vapi-main-container gap-4 sm:gap-6">
        <VapiControls book={result.data} />
      </div>
    </main>
  );
};

export default Page;
