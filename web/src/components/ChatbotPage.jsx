import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const BOT_REPLIES = {
  tr: {
    spending:
      "Bu bilgi backend bağlantısından sonra gerçek verilerle gösterilecektir.",
    budget: "Bütçe durumu backend verileri ile kontrol edilecektir.",
    category: "Kategori analizi backend bağlantısından sonra yapılacaktır.",
    savings:
      "Abonelikleri gözden geçirmek ve aylık bütçe limiti belirlemek tasarruf sağlamaya yardımcı olabilir.",
    pdf: "PDF Ekstre Analizi özelliği ile yüklediğiniz ekstrenin metni okunabilir ve harcama analizi yapılabilir.",
    hello: "Merhaba, size nasıl yardımcı olabilirim?",
    fallback: "Bu soruyu henüz anlayamadım. Yakında daha gelişmiş cevaplar verebileceğim.",
  },
  en: {
    spending: "This will show real data once the backend connection is enabled.",
    budget: "Budget status will be checked using backend data.",
    category: "Category analysis will be available after backend integration.",
    savings:
      "Reviewing subscriptions and setting monthly budget limits can help you save.",
    pdf: "With PDF Statement Analysis, you can read your statement text and analyze spending.",
    hello: "Hello, how can I help you?",
    fallback: "I could not understand that question yet. More advanced answers are coming soon.",
  },
};

const COPY = {
  tr: {
    title: "Finans Asistanı",
    placeholder: "Mesajınızı yazın…",
    send: "Gönder",
    empty: "Sohbete başlamak için bir mesaj gönderin.",
  },
  en: {
    title: "Finance Assistant",
    placeholder: "Type your message…",
    send: "Send",
    empty: "Send a message to start the conversation.",
  },
};

function normalizeMessage(text) {
  return text.trim().toLocaleLowerCase("tr-TR");
}

function resolveBotReply(userText, language = "tr") {
  const replies = BOT_REPLIES[language] || BOT_REPLIES.tr;
  const msg = normalizeMessage(userText);

  if (
    msg.includes("en çok hangi kategoriye harcadım") ||
    msg.includes("en cok hangi kategoriye harcadim")
  ) {
    return replies.category;
  }

  if (
    msg.includes("bu ay ne kadar harcadım") ||
    msg.includes("bu ay ne kadar harcadim") ||
    msg.includes("aylık harcamam") ||
    msg.includes("aylik harcamam") ||
    msg.includes("harcamalarım") ||
    msg.includes("harcamalarim")
  ) {
    return replies.spending;
  }

  if (
    msg.includes("bütçemi aştım mı") ||
    msg.includes("butcemi astim mi") ||
    msg.includes("bütçe") ||
    msg.includes("butce") ||
    msg.includes("limit")
  ) {
    return replies.budget;
  }

  if (msg.includes("tasarruf önerisi ver") || msg.includes("tasarruf onerisi ver")) {
    return replies.savings;
  }

  if (msg.includes("pdf ekstre analizi") || msg.includes("pdf ekstre")) {
    return replies.pdf;
  }

  if (msg.includes("merhaba") || msg.includes("selam")) {
    return replies.hello;
  }

  return replies.fallback;
}

function createMessage(role, text) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: Date.now(),
  };
}

export default function ChatbotPage({ language = "tr" }) {
  const t = COPY[language] || COPY.tr;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, createMessage("user", text)]);
    setInput("");
    setIsTyping(true);

    let reply = resolveBotReply(text, language);
    const requestUrl = "http://localhost:5000/chatbot/message";
    const token = api.getToken();
    const requestBody = { message: text };

    console.log("[Chatbot] request URL:", requestUrl);
    console.log("[Chatbot] token key: finwise_token");
    console.log("[Chatbot] Authorization header present:", Boolean(token));
    console.log(
      "[Chatbot] Authorization header preview:",
      token ? `Bearer ${token.slice(0, 12)}...` : null
    );
    console.log("[Chatbot] request body:", requestBody);

    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      const responseBody = await response.json().catch(() => ({}));
      console.log("[Chatbot] response status:", response.status);
      console.log("[Chatbot] response body:", responseBody);

      if (!response.ok) {
        const error = new Error(responseBody?.error || response.statusText || "Chatbot isteği başarısız.");
        error.status = response.status;
        error.data = responseBody;
        throw error;
      }

      if (typeof responseBody?.reply === "string" && responseBody.reply.trim()) {
        reply = responseBody.reply.trim();
        console.log("[Chatbot] using backend reply:", reply);
      } else {
        console.warn("[Chatbot] backend reply missing, using fallback");
      }
    } catch (error) {
      console.error("[Chatbot] request failed:", error);
      console.error("[Chatbot] error status:", error?.status);
      console.error("[Chatbot] error data:", error?.data);
      console.warn("[Chatbot] using fallback reply:", reply);
    }

    setMessages((prev) => [...prev, createMessage("bot", reply)]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        .chatbot-page .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .chatbot-page {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          min-height: min(70vh, 640px);
        }

        .chatbot-page .chatbot-title {
          margin: 0 0 1rem;
        }

        .chatbot-messages {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-height: 280px;
          max-height: min(52vh, 480px);
          overflow-y: auto;
          padding: 0.25rem 0.15rem 0.5rem;
          margin-bottom: 1rem;
        }

        .chatbot-empty {
          margin: auto;
          text-align: center;
          color: #848e9c;
          font-size: 0.9rem;
          padding: 2rem 1rem;
        }

        .chatbot-bubble {
          max-width: 85%;
          padding: 0.7rem 0.95rem;
          border-radius: 10px;
          font-size: 0.92rem;
          line-height: 1.45;
          word-break: break-word;
        }

        .chatbot-bubble--user {
          align-self: flex-end;
          background: rgba(240, 185, 11, 0.18);
          border: 1px solid rgba(240, 185, 11, 0.35);
          color: #eaecef;
        }

        .chatbot-bubble--bot {
          align-self: flex-start;
          background: #0b0e11;
          border: 1px solid #2b3139;
          color: #eaecef;
        }

        .chatbot-typing {
          align-self: flex-start;
          font-size: 0.82rem;
          color: #848e9c;
          padding: 0.25rem 0.5rem;
        }

        .chatbot-composer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: auto;
        }

        .chatbot-composer .form-field {
          margin: 0;
        }

        .chatbot-composer-row {
          display: flex;
          gap: 0.65rem;
          align-items: stretch;
        }

        .chatbot-composer-row .form-field {
          flex: 1;
        }

        .chatbot-send-btn {
          width: auto;
          min-width: 7rem;
          margin-top: 0;
          align-self: flex-end;
          white-space: nowrap;
        }

        @media (min-width: 640px) {
          .chatbot-composer-row {
            align-items: flex-end;
          }

          .chatbot-send-btn {
            margin-bottom: 0;
          }
        }

        @media (max-width: 639px) {
          .chatbot-page {
            min-height: min(75vh, 600px);
          }

          .chatbot-composer-row {
            flex-direction: column;
          }

          .chatbot-send-btn {
            width: 100%;
          }

          .chatbot-bubble {
            max-width: 92%;
          }
        }

        body.theme-light .chatbot-bubble--user {
          background: rgba(240, 185, 11, 0.14);
          border-color: rgba(180, 134, 11, 0.35);
          color: #1e2329;
        }

        body.theme-light .chatbot-bubble--bot {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #1e2329;
        }

        body.theme-light .chatbot-empty,
        body.theme-light .chatbot-typing {
          color: #64748b;
        }
      `}</style>

      <section className="card chatbot-page" aria-label={t.title}>
        <h2 className="section-title chatbot-title">{t.title}</h2>

        <div className="chatbot-messages" role="log" aria-live="polite" aria-relevant="additions">
          {messages.length === 0 && !isTyping ? (
            <p className="chatbot-empty">{t.empty}</p>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`chatbot-bubble chatbot-bubble--${message.role}`}
              role={message.role === "user" ? "article" : "status"}
            >
              {message.text}
            </div>
          ))}

          {isTyping ? <p className="chatbot-typing">…</p> : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-composer">
          <div className="chatbot-composer-row">
            <div className="form-field">
              <label htmlFor="chatbot-input" className="visually-hidden">
                {t.placeholder}
              </label>
              <input
                id="chatbot-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                autoComplete="off"
                disabled={isTyping}
              />
            </div>
            <button
              type="button"
              className="btn-primary chatbot-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
            >
              {t.send}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
