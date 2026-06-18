import { ASSISTANT_ID, DEFAULT_VOICE } from "@/constants";
import {
  endVoiceSession,
  startVoiceSession,
} from "@/lib/actions/session.actions";
import { IBook, Messages } from "@/types";
import { useAuth } from "@clerk/nextjs";
import Vapi from "@vapi-ai/web";
import { useCallback, useEffect, useRef, useState } from "react";

export type CallStatus =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking";

const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref; // Fix: was missing return
};

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY;

let vapi: InstanceType<typeof Vapi>;

function getVapi() {
  if (!vapi) {
    if (!VAPI_API_KEY) {
      throw new Error(
        "NEXT_PUBLIC_VAPI_API_KEY not found. Please set it in the .env file."
      );
    }
    vapi = new Vapi(VAPI_API_KEY);
  }
  return vapi;
}

interface TranscriptMessage {
  type: "transcript";
  role: "assistant" | "user";
  transcript: string;
  transcriptType: "partial" | "final";
}

function isTranscriptMessage(msg: unknown): msg is TranscriptMessage {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "type" in msg &&
    (msg as { type: unknown }).type === "transcript"
  );
}

export const useVapi = (book: IBook) => {
  const { userId } = useAuth();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [limitError, setLimitError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef<boolean>(false);

  const durationRef = useLatestRef(duration);
  const voice = book.persona || DEFAULT_VOICE;

  const isActive =
    status === "listening" ||
    status === "thinking" ||
    status === "speaking" ||
    status === "starting";

  const finalizeSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (!sessionId) return;
    try {
      await endVoiceSession(sessionId, durationRef.current);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }, [durationRef]);

  useEffect(() => {
    let vapiInstance: InstanceType<typeof Vapi>;
    try {
      vapiInstance = getVapi();
    } catch {
      return;
    }

    const handleCallStart = () => {
      setStatus("listening");
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    };

    const handleCallEnd = async () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setStatus("idle");
      setCurrentMessage("");
      setCurrentUserMessage("");
      isStoppingRef.current = false;

      await finalizeSession();

      setDuration(0);
    };

    const handleSpeechStart = () => setStatus("speaking");
    const handleSpeechEnd = () => setStatus("thinking");

    const handleMessage = (message: unknown) => {
      if (!isTranscriptMessage(message)) return;

      const { role, transcript, transcriptType } = message;

      if (role === "assistant") {
        setCurrentMessage(transcript);
        if (transcriptType === "final" && transcript) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: transcript },
          ]);
          setCurrentMessage("");
        }
      } else if (role === "user") {
        setCurrentUserMessage(transcript);
        if (transcriptType === "final" && transcript) {
          setMessages((prev) => [
            ...prev,
            { role: "user", content: transcript },
          ]);
          setCurrentUserMessage("");
        }
      }
    };

    // Fix: without this handler, Vapi's EventEmitter throws any error event as
    // an unhandled exception — which is the root cause of "Unhandled error (undefined)"
    const handleError = async (error: unknown) => {
      console.error("Vapi error:", error);
      setLimitError(error instanceof Error ? error.message : "An error occurred during the call");
      setStatus("idle");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await finalizeSession();
      setDuration(0);
    };

    vapiInstance.on("call-start", handleCallStart);
    vapiInstance.on("call-end", handleCallEnd);
    vapiInstance.on("speech-start", handleSpeechStart);
    vapiInstance.on("speech-end", handleSpeechEnd);
    vapiInstance.on("message", handleMessage);
    vapiInstance.on("error", handleError);

    return () => {
      vapiInstance.removeListener("call-start", handleCallStart);
      vapiInstance.removeListener("call-end", handleCallEnd);
      vapiInstance.removeListener("speech-start", handleSpeechStart);
      vapiInstance.removeListener("speech-end", handleSpeechEnd);
      vapiInstance.removeListener("message", handleMessage);
      vapiInstance.removeListener("error", handleError);
    };
  }, []);

  const start = async () => {
    if (!userId) return setLimitError("Please login to start a conversation");
    if (!ASSISTANT_ID)
      return setLimitError(
        "Voice assistant is not configured. Please contact support."
      );

    setLimitError(null);
    setStatus("connecting");

    try {
      const result = await startVoiceSession(userId, book._id.toString());

      if (!result.success) {
        setLimitError(
          result.error || "Session limit reached. Please upgrade your plan"
        );
        setStatus("idle");
        return;
      }

      sessionIdRef.current = result.sessionId || null;

      const firstMessage = `Hey, good to meet you. Quick question, before we dive in: have you actually read ${book.title} yet? Or are we starting fresh?`;

      const call = await getVapi().start(ASSISTANT_ID, {
        firstMessage,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
        },
      });

      if (call) setStatus("starting");
    } catch (error) {
      console.error("Error starting call:", error);
      await finalizeSession();
      setStatus("idle");
      setLimitError("An error occurred while starting the call");
    }
  };

  const stop = async () => {
    isStoppingRef.current = true;
    await getVapi().stop();
  };

  const clearError = () => setLimitError(null);

  return {
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
  };
};

export default useVapi;
