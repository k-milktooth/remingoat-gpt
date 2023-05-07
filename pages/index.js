import { useRef, useState, useEffect, useMemo } from "react";
import { Disclosure } from "@headlessui/react";
import ReactMarkdown from "react-markdown";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { end, message, sourceDocuments } from "@/utils/object-identifiers";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { NextSeo } from "next-seo";
import { twMerge } from "tailwind-merge";
import TextareaAutosize from "react-textarea-autosize";
import Image from "next/image";

// String representing type of message in chat session
const API_MESSAGE = "apiMessage";
const USER_MESSAGE = "userMessage";

// Examples to show on page load
const introPromptQuestions = [
  "Sound signature of the Jwick Semi-Silents?",
  "What's the difference between thock and clack?",
  "How is the stem wobble on the Gateron CJs?",
];

export default function Home() {
  const [showIntroPrompt, setShowIntroPrompt] = useState(true);
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

    setShowIntroPrompt(false);

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

  const fillTextbox = (text) => {
    setQuery(text);
  };

  return (
    <>
      <NextSeo
        title="RemingoatGPT: AI-powered chatbot for mechanical keyboard switches"
        description="RemingoatGPT is a GPT-3 powered chatbot that answers questions about mechanical keyboard switches"
        openGraph={{
          images: [
            {
              url: "https://user-images.githubusercontent.com/132307192/236652223-5bc352e7-e1a3-4a6f-9ee5-fba331b8b11e.png",
              width: 1200,
              height: 630,
              alt: "RemingoatGPT: AI-powered chatbot for mechanical keyboard switches",
            },
          ],
        }}
      />
      <div className="mx-auto gap-4">
        <main className="">
          <h1 className="sr-only text-center text-2xl font-bold leading-[1.1] tracking-tighter">
            RemingoatGPT
          </h1>
          <div className="">
            <div
              ref={messageListRef}
              className="h-[80vh] overflow-y-scroll border border-[#333333]"
            >
              {showIntroPrompt && (
                <div className="bg-[#333333] py-4 lg:text-center">
                  <div className="mx-4 grid gap-4 lg:gap-2">
                    <p className="">
                      I'm RemingoatGPT, your friendly AI-powered chatbot that
                      helps you query insights from{" "}
                      <a
                        href="https://www.theremingoat.com/"
                        target="_blank"
                        className="underline decoration-emerald-500 decoration-2 underline-offset-4"
                      >
                        TheRemingoat switch reviews
                      </a>
                      .
                    </p>
                    <p>Not sure where to start? Try one of these prompts:</p>
                    <div className="mt-2 grid gap-2">
                      {introPromptQuestions.map((question) => (
                        <div key={question}>
                          <button
                            type="button"
                            onClick={() => fillTextbox(question)}
                            className="p-1 underline decoration-yellow-500 decoration-2 underline-offset-4 hover:bg-[#262626]"
                          >
                            "{question}"→
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
                        className="prose prose-invert mx-4 max-w-none lg:col-span-11 lg:mx-12"
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
                              className="py-2 lg:px-12"
                            >
                              <Disclosure>
                                <Disclosure.Button>
                                  <h4 className="text-sm font-semibold opacity-50">
                                    Source {sourceDocIndex + 1}
                                  </h4>
                                </Disclosure.Button>
                                <Disclosure.Panel className="mt-2 bg-[#262626] p-4">
                                  <ReactMarkdown
                                    className="prose prose-sm prose-invert max-w-none"
                                    linkTarget="_blank"
                                  >
                                    {doc.pageContent}
                                  </ReactMarkdown>
                                  <p className="mt-2">
                                    <a
                                      target="_blank"
                                      href={doc.metadata.source}
                                      className="text-sm underline decoration-emerald-500 decoration-2 underline-offset-4"
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
          <div className="relative mt-4 w-full flex-grow bg-[#333333] py-2 dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] md:py-3 md:pl-4">
            <form
              className="grid grid-cols-5 lg:grid-cols-10"
              onSubmit={handleSubmit}
            >
              <TextareaAutosize
                className="col-span-4 m-0 w-full resize-none bg-transparent p-0 pl-2 pr-7 focus:outline-none dark:bg-transparent md:pl-0 lg:col-span-9"
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
                className="col-span-1 justify-self-end pr-2"
                disabled={loading}
              >
                {loading ? (
                  <svg
                    class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
                  <PaperAirplaneIcon className="inline-block h-5 w-5 justify-self-end text-white hover:bg-[#262626]" />
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
