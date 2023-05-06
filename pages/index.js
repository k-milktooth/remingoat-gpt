import { useRef, useState, useEffect, useMemo } from "react";
import { Disclosure } from "@headlessui/react";
import ReactMarkdown from "react-markdown";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { end, message, sourceDocuments } from "@/utils/object-identifiers";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import { NextSeo } from "next-seo";
import { twMerge } from "tailwind-merge";
import TextareaAutosize from "react-textarea-autosize";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messageState, setMessageState] = useState({
    messages: [],
    history: [],
    pending: "", // Saves the response from the current query
    pendingSourceDocs: [], // Saves the source documents from current query
  });

  const { messages, history, pending } = messageState;

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    if (!query) {
      alert("Please input a question");
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: "userMessage",
          message: question,
        },
      ],
      pending: undefined,
    }));

    setLoading(true);
    setQuery("");
    setMessageState((state) => ({ ...state, pending: "" }));

    const ctrl = new AbortController();

    try {
      fetchEventSource("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          history,
        }),
        signal: ctrl.signal,
        onmessage: (event) => {
          const data = JSON.parse(event.data);
          switch (data.object) {
            case end:
              setMessageState((state) => ({
                ...state,
                history: [...state.history, [question, state.pending ?? ""]],
                messages: [
                  ...state.messages,
                  {
                    type: "apiMessage",
                    message: state.pending ?? "",
                    sourceDocs: state.pendingSourceDocs,
                  },
                ],

                // Reset for the next query
                pending: undefined,
                pendingSourceDocs: [],
              }));

              setLoading(false);
              ctrl.abort();
              break;

            case message:
              setMessageState((state) => ({
                ...state,
                pending: (state.pending ?? "") + data.data, // Build up the current response token by token
              }));
              break;

            case sourceDocuments:
              setMessageState((state) => ({
                ...state,
                pendingSourceDocs: data.data, // Set the source documents for the current response
              }));

              break;

            default:
            // Do nothing
          }
        },
      });
    } catch (error) {
      setLoading(false);
      console.error("Error: ", error);
    }
  }

  // Prevent empty submissions
  const handleEnter = (e) => {
    if (e.key === "Enter" && query) {
      handleSubmit(e);
    } else if (e.key == "Enter") {
      e.preventDefault();
    }
  };

  const chatMessages = useMemo(() => {
    return [
      ...messages,
      ...(pending ? [{ type: "apiMessage", message: pending }] : []),
    ];
  }, [messages, pending]);

  return (
    <>
      <NextSeo
        title="RemingoatGPT"
        description="RemingoatGPT is a GPT-3 powered chatbot that answers questions about mechanical keyboard switches"
      />
      <div className="mx-auto gap-4">
        <main className="">
          <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center sr-only">
            RemingoatGPT
          </h1>
          <div className="">
            <div
              ref={messageListRef}
              className="h-[80vh] overflow-y-scroll border border-gray-500"
            >
              {chatMessages.map((message, index) => {
                let className;
                if (message.type === "apiMessage") {
                  className = "bg-[#333333]";
                } else {
                  className =
                    loading && index === chatMessages.length - 1
                      ? "bg-black animate-pulse"
                      : "bg-[#222222]";
                }

                className = twMerge("py-4 grid", className);

                return (
                  <div key={index} className={className}>
                    <ReactMarkdown
                      className="prose prose-invert max-w-none mx-4 lg:mx-12 "
                      linkTarget="_blank"
                    >
                      {message.message}
                    </ReactMarkdown>
                    {message.sourceDocs && (
                      <div>
                        {message.sourceDocs.map((doc, sourceDocIndex) => (
                          <div
                            key={`messageSourceDocs-${sourceDocIndex}`}
                            className="mx-4 lg:px-12 py-2"
                          >
                            <Disclosure>
                              <Disclosure.Button>
                                <h4>Source {sourceDocIndex + 1}</h4>
                              </Disclosure.Button>
                              <Disclosure.Panel className="mt-2 p-4 bg-[#262626]">
                                <ReactMarkdown
                                  className="prose prose-sm max-w-none prose-invert"
                                  linkTarget="_blank"
                                >
                                  {doc.pageContent}
                                </ReactMarkdown>
                                <p className="mt-2">
                                  <a
                                    target="_blank"
                                    href={doc.metadata.source}
                                    className="underline decoration-emerald-500 decoration-2 underline-offset-4"
                                  >
                                    {doc.metadata.source}
                                  </a>
                                </p>
                              </Disclosure.Panel>
                            </Disclosure>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 w-full py-2 flex-grow md:py-3 md:pl-4 relative bg-[#333333] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]">
            <form onSubmit={handleSubmit}>
              <TextareaAutosize
                className="m-0 w-full resize-none bg-transparent p-0 pr-7 focus:outline-none dark:bg-transparent pl-2 md:pl-0"
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                id="userInput"
                name="userInput"
                placeholder={
                  loading
                    ? "Waiting for response..."
                    : "Ask a question about switches."
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                {loading ? (
                  <svg
                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  // Send icon SVG in input field
                  <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
          {error && (
            <div className="border border-red-400 p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
