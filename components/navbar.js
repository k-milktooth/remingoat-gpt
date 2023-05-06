import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

export default function Navbar() {
  let [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <nav className="grid grid-cols-2 py-4">
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-10 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto text-white">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-[#262626] p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6"
                  >
                    About
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm">
                      RemingoatGPT is an AI-powered Q&A chatbot that lets you
                      ask questions and get answers from{" "}
                      <a
                        href="https://www.theremingoat.com/"
                        target="_blank"
                        className="underline decoration-emerald-500 decoration-2 underline-offset-4"
                      >
                        TheRemingoat switch reviews
                      </a>
                      , offering a balance between detail and efficiency to make
                      the switch discovery and research process easier and more
                      successful.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <h4>What's the motivation of this project?</h4>
                      <p className="text-sm">
                        Remingoat switch reviews have a lot of information.
                        However, at thousands of words each, they are arguably{" "}
                        <span className="italic">too</span> information dense. A
                        Q&A chatbot gives you only the information that you
                        need, saving you time and energy in your switch research
                        process.
                      </p>
                    </div>
                    <div>
                      <h4>Is this project open-source?</h4>
                      <p className="text-sm">
                        Yes; source code available{" "}
                        <a
                          className="underline decoration-emerald-500 decoration-2 underline-offset-4"
                          href="https://github.com/k-milktooth/remingoat-gpt/"
                        >
                          here
                        </a>
                        .
                      </p>
                    </div>
                    <div>
                      <h4>How can I support theRemingoat?</h4>
                      <p className="text-sm">
                        He has a{" "}
                        <a
                          className="underline decoration-emerald-500 decoration-2 underline-offset-4"
                          href="https://www.patreon.com/theremingoat"
                        >
                          Patreon
                        </a>
                        !
                      </p>
                    </div>
                    <div>
                      <h4>How much does this site cost to maintain?</h4>
                      <p className="text-sm">
                        It depends on user traffic: the more it's used the more
                        OpenAI API costs are incurred. If you've found the site
                        useful and want to support it, please consider{" "}
                        <a
                          className="underline decoration-emerald-500 decoration-2 underline-offset-4"
                          href="https://donate.stripe.com/fZebME240bbcf0A5kD"
                        >
                          making a donation
                        </a>
                        .
                      </p>
                    </div>
                    <div>
                      <h4>Where can I provide feedback?</h4>
                      <p className="text-sm">
                        Let us know on our{" "}
                        <a
                          href="https://discord.gg/hrDW39FpHx"
                          className="underline decoration-emerald-500 decoration-2 underline-offset-4"
                        >
                          Discord server
                        </a>
                        !
                      </p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      className="inline-flex justify-center border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Return to RemingoatGPT
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Link className="font-semibold hover:opacity-50" href="/">
        RemingoatGPT
      </Link>

      <div className="justify-self-end">
        <button className="hover:opacity-50" type="button" onClick={openModal}>
          About
        </button>
      </div>
    </nav>
  );
}
