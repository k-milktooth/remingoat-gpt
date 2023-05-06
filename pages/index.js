import { useRef, useState, useEffect, useMemo } from "react";
import { Disclosure } from "@headlessui/react";
import ReactMarkdown from "react-markdown";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { end, message, sourceDocuments } from "@/utils/object-identifiers";
import { ChevronUpIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { NextSeo } from "next-seo";
import { twMerge } from "tailwind-merge";
import TextareaAutosize from "react-textarea-autosize";
import Image from "next/image";

// String representing type of message in chat session
const API_MESSAGE = "apiMessage";
const USER_MESSAGE = "userMessage";

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
          type: USER_MESSAGE,
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
                    type: API_MESSAGE,
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
      ...(pending ? [{ type: API_MESSAGE, message: pending }] : []),
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
              className="h-[80vh] overflow-y-scroll border border-[#333333]"
            >
              {chatMessages.map((message, index) => {
                let className;
                let profilePic;
                let profilePicAlt;

                // Message from the bot
                if (message.type === API_MESSAGE) {
                  className = "bg-[#333333]";
                  profilePic =
                    "https://user-images.githubusercontent.com/132307192/236642626-f7ada1b2-e52c-4c90-954b-029591dc8436.jpg";
                  profilePicAlt = "Robogoat";
                }
                // Message from the user
                else if (message.type === USER_MESSAGE) {
                  className =
                    loading && index === chatMessages.length - 1
                      ? "bg-black animate-pulse"
                      : "bg-[#222222]";
                  profilePic =
                    "https://user-images.githubusercontent.com/132307192/236644162-1160d629-aba2-4b84-988b-7aae70d06d0b.jpg";
                  profilePicAlt = "You";
                }

                className = twMerge("py-4 grid", className);

                return (
                  <div key={index} className={className}>
                    <div className="grid lg:grid-cols-12">
                      <Image
                        src={profilePic}
                        alt={profilePicAlt}
                        width={35}
                        height={35}
                        className="col-span-1 mx-4 mb-2 lg:mx-0 lg:mb-0 lg:justify-self-end"
                      />
                      <ReactMarkdown
                        className="prose prose-invert max-w-none mx-4 lg:mx-12 lg:col-span-11"
                        linkTarget="_blank"
                      >
                        {message.message}
                      </ReactMarkdown>
                    </div>
                    <div></div>
                    <div className="mt-2 grid lg:grid-cols-12">
                      <div></div>
                      {message.sourceDocs && (
                        <div className="mx-4 lg:col-span-11">
                          {message.sourceDocs.map((doc, sourceDocIndex) => (
                            <div
                              key={`messageSourceDocs-${sourceDocIndex}`}
                              className="lg:px-12 py-2"
                            >
                              <Disclosure>
                                <Disclosure.Button>
                                  <h4 className="font-semibold text-sm opacity-50">
                                    Source {sourceDocIndex + 1}
                                  </h4>
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
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 w-full py-2 flex-grow md:py-3 md:pl-4 relative bg-[#333333] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]">
            <form
              className="grid grid-cols-5 lg:grid-cols-10"
              onSubmit={handleSubmit}
            >
              <TextareaAutosize
                className="m-0 w-full resize-none bg-transparent p-0 pr-7 focus:outline-none dark:bg-transparent pl-2 md:pl-0 col-span-4 lg:col-span-9"
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
              <button
                type="submit"
                className="justify-self-end pr-2 col-span-1"
                disabled={loading}
              >
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
                  <PaperAirplaneIcon className="hover:bg-[#262626] h-5 w-5 text-white justify-self-end inline-block" />
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
