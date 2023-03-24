import { type NextPage } from "next";
import { trpc } from "@/utils/trpc";
import { Edit, LogOut, Plus, Trash, Send } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";
import { Conversation, Message } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { CodeBlock } from "@/components/CodeBlock";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog";
import { Input } from "@/components";
import { createPrefixId } from "@/utils";

const ConversationView: NextPage = () => {
  const userChangedConvo = React.useRef(false);
  const lastMessageRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const conversationBody = React.useRef<HTMLDivElement>(null);
  const conversationContainer = React.useRef<HTMLDivElement>(null);
  const [isGettingStarted, setIsGettingStarted] = React.useState(false);
  const [activeConversationId, setActiveConversationId] = React.useState("");
  const [input, setInput] = React.useState("");

  const utils = trpc.useContext();
  const convos = trpc.conversations.list.useQuery();
  const messages = trpc.messages.list.useQuery({
    conversationId: activeConversationId,
  });
  const createConvo = trpc.conversations.create.useMutation({
    onMutate: async (data) => {
      utils.conversations.list.cancel();

      const prev = utils.conversations.list.getData();

      if (!prev) {
        return;
      }

      // @ts-ignore
      utils.conversations.list.setData(undefined, () => {
        return [
          {
            id: data?.id!,
            name: data?.name!,
            userId: "", // get from session
            updatedAt: new Date(),
            createdAt: new Date(),
            messages: [] as Message[],
            note: "",
          } as Conversation,
          ...prev,
        ];
      });

      return prev;
    },
    onSettled: (data, error, variables) => {
      if (data && !userChangedConvo.current) {
        if (activeConversationId === variables?.id) {
          setActiveConversationId(data.id);
        }
      } else {
        userChangedConvo.current = false;
      }
      utils.conversations.list.invalidate();
    },
    onError: (err, data) => {
      toast.error(err.message);
    },
  });
  const deleteConvo = trpc.conversations.delete.useMutation({
    onMutate: async (id) => {
      utils.conversations.list.cancel();

      const prev = utils.conversations.list.getData();

      if (!prev) {
        return;
      }

      // Get the index of the current active conversation
      const currentIndex = prev.findIndex((convo) => convo.id === id);

      // Update the active conversation ID based on the position of the deleted conversation
      if (currentIndex !== -1 && currentIndex < prev.length - 1) {
        setActiveConversationId(prev[currentIndex + 1].id);
      } else if (currentIndex !== -1 && currentIndex > 0) {
        setActiveConversationId(prev[currentIndex - 1].id);
      } else {
        setActiveConversationId("");
      }

      utils.conversations.list.setData(undefined, () => {
        return prev.filter((convo) => convo.id !== id);
      });
    },
    onSettled: () => {
      utils.conversations.list.invalidate();
    },
  });
  const createMessage = trpc.messages.create.useMutation({
    onMutate: async (data) => {
      utils.messages.list.cancel();

      const prev = utils.messages.list.getData({
        conversationId: activeConversationId,
      });

      if (!prev) {
        return;
      }

      const id = createId();

      utils.messages.list.setData(
        { conversationId: activeConversationId },
        () => {
          return [
            ...prev,
            {
              id,
              text: data.prompt,
              role: "user",
              conversationId: data.conversationId,
              parentId: data?.parentId,
              updatedAt: new Date(),
              createdAt: new Date(),
            } as Message,
          ];
        }
      );
    },
    onSettled: () => {
      utils.messages.list.invalidate();
    },

    onError: (err, data) => {
      toast.error(err.message);
    },
  });

  /**
   * Select first conversation on load only, not when they change
   * and focus on input
   */
  React.useEffect(() => {
    if (convos?.data?.length && !activeConversationId) {
      setActiveConversationId(convos?.data[0].id);
      inputRef.current?.focus();
    }
  }, [convos?.data]);

  /**
   * Scroll to bottom of conversation when new message is added
   */
  React.useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView();
    }
  }, [messages]);

  /**
   * Delete conversation on backspace when not focused on input
   */
  // React.useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === "Backspace" && !inputRef.current?.value) {
  //       deleteConvo.mutate(activeConversationId);
  //     }
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [activeConversationId]);

  /**
   * Move to the next conversation on up/down arrow
   */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        const index = convos?.data?.findIndex(
          (convo) => convo.id === activeConversationId
        );
        if (index !== undefined && index > 0) {
          setActiveConversationId(convos?.data?.[index - 1]?.id!);
        }
      }
      if (e.key === "ArrowDown") {
        const index = convos?.data?.findIndex(
          (convo) => convo.id === activeConversationId
        );
        if (index !== undefined && index < convos?.data?.length! - 1) {
          setActiveConversationId(convos?.data?.[index + 1]?.id!);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeConversationId]);

  const apiKeys = trpc.apiKeys.list.useQuery();

  return (
    <div className="conversation-view flex h-screen bg-[#f8f8f8] text-sm">
      <div className="conversation-list w-[300px] flex flex-col bg-[#f8f8f8] border-r border-[#f3f3f3]">
        <div className="conversation-item flex-none px-4 py-2">
          <h2 className="text-lg font-medium  flex justify-between">
            <span className=""></span>
            <Button onClick={(e) => deleteConvo.mutate(activeConversationId)}>
              <Trash color="#999" size={18} />
            </Button>
          </h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          <ul className="">
            {convos?.data?.map((convo) => {
              const date = new Date(convo?.updatedAt!);
              // date needs to be format 4:23 PM
              const time = date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              });
              return (
                <li
                  className="conversation-item rounded-lg m-4 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={(e) => {
                    setActiveConversationId(convo.id);

                    /**
                     * Scroll to bottom of conversation
                     */
                    conversationBody.current?.scrollTo({
                      top: conversationBody.current?.scrollHeight,
                    });

                    /**
                     * Focus on input
                     */
                    inputRef.current?.focus();

                    /**
                     * Set user changed convo
                     */
                    userChangedConvo.current = true;
                  }}
                  style={{
                    color: (activeConversationId === convo.id && "#fff") || "",
                    backgroundColor:
                      (activeConversationId === convo.id && "#555fff") || "",
                  }}
                >
                  <div className="flex items-center w-full">
                    {/* <div className="w-10 h-10 rounded-full bg-gray-200 mr-4"></div> */}
                    <div className="flex-grow mr-2 truncate">
                      <h2
                        className="truncate text-[#171717]"
                        style={{
                          color:
                            (activeConversationId === convo.id && "#fff") || "",
                        }}
                      >
                        {convo.name}
                      </h2>
                      <span
                        className="text-neutral-500 truncate"
                        style={{
                          color:
                            (activeConversationId === convo.id && "#ddd") || "",
                        }}
                      >
                        {convo.messages?.[0]?.text || "No messages"}
                      </span>
                    </div>
                    <span
                      className="text-xs text-neutral-500"
                      style={{
                        color:
                          (activeConversationId === convo.id && "#ddd") || "",
                      }}
                    >
                      {time}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="conversation-item flex-none p-7 space-y-4 text-xs text-[#666]">
          {!apiKeys.isLoading && (
            <AddApiKeyDialog
              apiKey={apiKeys?.data?.find((x) => x.type === "openAi")}
            />
          )}
          <span
            className="flex items-center cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              signOut();
            }}
          >
            <LogOut color="#999" size="16" />

            <span className="ml-2 ">Sign out</span>
          </span>
        </div>
      </div>
      <div
        ref={conversationContainer}
        className="conversation-container flex-grow flex flex-col bg-white"
      >
        <div className="conversation-header border-b border-[#f3f3f3] px-4 py-2">
          <h2 className="text-lg font-medium">
            <Button
              onClick={(e) => {
                e.preventDefault();

                /**
                 * Prevent creating new convo if there is already an empty convo
                 */
                const emptyConvo =
                  convos?.data &&
                  convos?.data?.length > 0 &&
                  messages?.data?.length === 0;
                if (emptyConvo) {
                  inputRef.current?.focus();
                  return;
                }

                const id = createId();
                setActiveConversationId(id);
                createConvo.mutate({
                  id,
                  name: "New conversation",
                });

                /**
                 * Focus on input
                 */
                inputRef.current?.focus();
              }}
            >
              <Edit color="#999" size={18} />
            </Button>
          </h2>
        </div>
        <div
          ref={conversationBody}
          className="conversation-body flex-grow overflow-y-auto"
        >
          <div className="p-4">
            {messages?.data?.map((msg, i) => {
              const isLastMessage = i === messages.data.length - 1;

              if (msg.role === "assistant") {
                return (
                  <div className="flex justify-start mb-4 overflow-x-hidden max-w-[800px]">
                    <div className="conversation-message text-[#171717] conversation-message-sent bg-[#f8f8f8] border-[1px] border-[#f3f3f3] rounded-md py-2 px-3">
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => (
                            <p className="p-0 m-0 text-sm" {...props} />
                          ),
                          code({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );

                            return !inline ? (
                              <div className="relative w-full mb-4">
                                <CodeBlock
                                  language={match?.[1] || "jsx"}
                                  children={String(children).replace(/\n$/, "")}
                                />
                              </div>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg?.text!}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  ref={isLastMessage ? lastMessageRef : null}
                  className="flex justify-end mb-4"
                >
                  <div className="max-w-[800px] conversation-message conversation-message-received max-w-2/3 bg-[#555fff] rounded-lg py-2 px-4">
                    <p className="text-white p-0 m-0 text-sm">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            {createMessage.isLoading && (
              <div className="flex justify-start mb-4 overflow-x-hidden">
                <div className="conversation-message text-[#171717] conversation-message-sent bg-[#f8f8f8] border-[1px] border-[#f3f3f3] rounded-md py-2 px-3">
                  <p className=" p-0 m-0 text-sm">Typing...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="conversation-input border-t border-[#f3f3f3] bg-white px-4 py-4">
          <div className="flex items-center relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input === "") {
                  return;
                }

                if (e.key === "Enter") {
                  createMessage.mutate({
                    conversationId: activeConversationId,
                    prompt: input,
                  });
                  setInput("");
                }

                if (e.key == "Escape") {
                  inputRef.current?.blur();
                }
              }}
              // type="text"
              placeholder="Ask a question..."
              className="bg-[#f8f8f8] border border-[#f3f3f3] rounded-full h-[32px] px-4 flex-grow focus:outline-none focus:border-[#555fff] pr-12"
            />
            {/* <SendButton 
              onClick={() => {
                if (input){
                  createMessage.mutate({
                    conversationId: activeConversationId,
                    prompt: input,
                  });
                  setInput("");
                }
              }}>
              <Send color="#888" size={14} />
            </SendButton> */}
          </div>
        </div>
      </div>
      <RightNav conversationId={activeConversationId} />
    </div>
  );
};

const RightNav = ({ conversationId }) => {
  const utils = trpc.useContext();
  const updateConvo = trpc.conversations.update.useMutation({
    onMutate: (data) => {
      const prev = utils.conversations.get.getData(data?.id!);

      if (!prev) return;

      utils.conversations.get.setData(data?.id!, () => {
        return {
          ...prev,
          note: data?.note!,
        };
      });
    },
  });

  const convo = trpc.conversations.get.useQuery(conversationId);

  return (
    <div className="right-side-panel w-[300px] bg-[#f8f8f8] border-l border-[#f3f3f3] flex flex-col">
      <div className="p-4 w-full">
        <textarea
          value={convo?.data?.note!}
          onChange={(e) => {
            updateConvo.mutate({
              id: conversationId,
              note: e.target.value,
            });
          }}
          className="w-full"
        ></textarea>
      </div>
    </div>
  );
};

const AddApiKeyDialog = ({ apiKey }) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | null>(apiKey?.apiKey || "");
  const utils = trpc.useContext();

  const createConvo = trpc.conversations.create.useMutation({
    onSettled: () => {
      utils.conversations.invalidate();
    },
  });

  const createApiKey = trpc.apiKeys.create.useMutation({
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Api Key added");
    },
    onSettled: () => {
      utils.apiKeys.invalidate();

      setOpen(false);
    },
  });

  const updateApiKey = trpc.apiKeys.update.useMutation({
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Api Key updated");
    },
    onSettled: () => {
      utils.apiKeys.invalidate();
    },
  });

  /**
   * Open modal after 1s if no api key
   */
  React.useEffect(() => {
    if (!apiKey) {
      setTimeout(() => {
        setOpen(true);
      }, 1000);
    }
  }, [apiKey]);

  /**
   * Update or create api key
   *
   * Create a conversation if creating a new api key
   */
  const handleUpsert = () => {
    if (apiKey) {
      updateApiKey.mutate({
        id: apiKey.id,
        apiKey: value,
        type: "openAi",
      });
    } else {
      createApiKey.mutate({
        apiKey: value!,
        type: "openAi",
      });

      createConvo.mutate({
        name: "New Conversation",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <span className="flex items-center cursor-pointer" onClick={(e) => {}}>
          <Plus color="#999" size="16" />

          <span className="ml-2">Add OpenAi Api Key</span>
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your OpenAi Api Key</DialogTitle>
          <DialogDescription>
            You can get your OpenAi Api Key{" "}
            <a
              href="https://beta.openai.com/account/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500"
            >
              here
            </a>
          </DialogDescription>
        </DialogHeader>

        <Input
          value={value || ""}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleUpsert();
            }
          }}
          placeholder="sk-pWy8iw...oVKH6RhRL"
          className="px-2 h-8"
        />

        <div className="flex justify-between mt-4">
          <span></span>
          <Button
            loading={createApiKey.isLoading || updateApiKey.isLoading}
            onClick={handleUpsert}
          >
            <span>Save</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

type ButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
  onClick?: (e: any) => void;
};

const Button = ({ loading, children, ...rest }: ButtonProps) => {
  return (
    <button
      disabled={loading}
      style={{
        boxShadow: "rgb(0 0 0 / 5%) 0px 1px 1px",
        opacity: loading ? 0.5 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        background: "linear-gradient(#fcfcfc, #FAFAFA)",
      }}
      className="inline-flex text-sm items-center justify-center whitespace-nowrap hover:bg-[#444] flex-shrink-0 m-0 rounded-md font-medium border transition-all duration-200 cursor-pointer select-none outline-none app-region-no-drag bg-white text-[#444] py-[4px] px-2"
      {...rest}
    >
      {children}
    </button>
  );
};

const SendButton = ({ loading, children, ...rest }: ButtonProps) => {
  return (
    <button
      disabled={loading}
      style={{
        boxShadow: "rgb(0 0 0 / 5%) 0px 1px 1px",
        opacity: loading ? 0.5 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        background: "linear-gradient(#fcfcfc, #FAFAFA)",
      }}
      className="absolute right-2 inline-flex text-sm items-center justify-center whitespace-nowrap hover:bg-[#444] flex-shrink-0 m-0 rounded-full font-medium border transition-all duration-200 cursor-pointer select-none outline-none app-region-no-drag bg-white text-[#444] py-[4px] px-2"
      {...rest}
    >
      {children}
    </button>
  );
};

export default ConversationView;
