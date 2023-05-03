import { useRef, useState, useEffect, useMemo } from "react";
import { Disclosure } from "@headlessui/react";
import ReactMarkdown from "react-markdown";
import { fetchEventSource } from "@microsoft/fetch-event-source";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messageState, setMessageState] = useState({
    messages: [],
    pending: "",
    history: [],
  });

  const { messages, pending, history } = messageState;

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
          if (event.data === "[DONE]") {
            setMessageState((state) => ({
              history: [...state.history, [question, state.pending ?? ""]],
              messages: [
                ...state.messages,
                {
                  type: "apiMessage",
                  message: state.pending ?? "",
                },
              ],
              pending: undefined,
            }));
            setLoading(false);
            ctrl.abort();
          } else {
            const data = JSON.parse(event.data);
            setMessageState((state) => ({
              ...state,
              pending: (state.pending ?? "") + data.data,
            }));
          }
        },
      });
    } catch (error) {
      setLoading(false);
      console.log("Error: ", error);
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
        <main className="p-24">
          <div>
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
                      <div key={`messageSourceDocs-${index}`}>
                        {message.sourceDocs.map((doc, index) => (
                          <Disclosure>
                            <Disclosure.Button>
                              <h3>Source {index + 1}</h3>
                            </Disclosure.Button>
                            <Disclosure.Panel>
                              <ReactMarkdown linkTarget="_blank">
                                {doc.pageContent}
                              </ReactMarkdown>
                              <p className="mt-2">
                                <span>Source:</span>{" "}
                                <a target="_blank" href={doc.metadata.source}>
                                  {doc.metadata.source}
                                </a>
                              </p>
                            </Disclosure.Panel>
                          </Disclosure>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
