import { useRef, useState, useEffect, useMemo } from "react";
import { Disclosure } from "@headlessui/react";
import ReactMarkdown from "react-markdown";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { end, message, sourceDocuments } from "@/utils/object-identifiers";
import { ChevronUpIcon } from "@heroicons/react/20/solid";

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
      <div className="mx-auto gap-4">
        <h1 className="mt-12 text-2xl font-bold leading-[1.1] tracking-tighter text-center">
          RemingoatGPT
        </h1>
        <main className="">
          <div ref={messageListRef}>
            {chatMessages.map((message, index) => {
              let className;
              if (message.type === "apiMessage") {
                className = "bg-gray-100";
              } else {
                className =
                  loading && index === chatMessages.length - 1
                    ? "bg-red-100 animate-pulse"
                    : "bg-blue-100";
              }

              return (
                <div key={index} className={className}>
                  <ReactMarkdown linkTarget="_blank">
                    {message.message}
                  </ReactMarkdown>
                  {message.sourceDocs && (
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="bg-purple-100 grid grid-cols-2 w-full px-2 py-1">
                            <h3 className="justify-self-start">Sources</h3>
                            <ChevronUpIcon
                              className={`${
                                open ? "rotate-180 transform" : ""
                              } h-5 w-5 justify-self-end`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel>
                            {message.sourceDocs.map((doc, sourceDocIndex) => (
                              <div key={`messageSourceDocs-${sourceDocIndex}`}>
                                <Disclosure>
                                  <Disclosure.Button>
                                    <h4>Source {sourceDocIndex + 1}</h4>
                                  </Disclosure.Button>
                                  <Disclosure.Panel>
                                    <ReactMarkdown linkTarget="_blank">
                                      {doc.pageContent}
                                    </ReactMarkdown>
                                    <p className="mt-2">
                                      <a
                                        target="_blank"
                                        href={doc.metadata.source}
                                      >
                                        {doc.metadata.source}
                                      </a>
                                    </p>
                                  </Disclosure.Panel>
                                </Disclosure>
                              </div>
                            ))}
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  )}
                </div>
              );
            })}
          </div>
          <div>
            <div>
              <form onSubmit={handleSubmit}>
                <textarea
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
                    <div>
                      <p>Loading...</p>
                    </div>
                  ) : (
                    // Send icon SVG in input field
                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
          {error && (
            <div className="border border-red-400 rounded-md p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </main>
      </div>
      <footer className="m-auto p-4">Powered by LangChainAI.</footer>
    </>
  );
}
