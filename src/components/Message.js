import React from "react";

const defaultAvatar = "https://ui-avatars.com/api/?background=random";

export default function Message({ msg, onReactClick, onReply }) {
  // Render a different style for system messages
  if (msg.system) {
    return (
      <div
        style={{
          textAlign: "center",
          fontStyle: "italic",
          color: "#666",
          margin: "10px 0",
          fontSize: 14,
          userSelect: "none"
        }}
      >
        {msg.text}
      </div>
    );
  }

  const isOnline = msg.isOnline ?? true; // Default true or pass actual online status

  return (
    <div
      className="message-bubble fade-in"
      style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        <img
          className="avatar"
          src={msg.avatarUrl || defaultAvatar}
          alt="user avatar"
        />
        <span
          className={`avatar-status ${
            isOnline ? "avatar-online" : "avatar-offline"
          }`}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid white",
            backgroundColor: isOnline ? "#22c55e" : "#9ca3af"
          }}
        />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "bold", marginBottom: 4 }}>{msg.user}</div>
        {msg.reply && (
          <div
            style={{
              fontStyle: "italic",
              color: "#444",
              margin: "6px 0",
              borderLeft: "3px solid #ccc",
              paddingLeft: 8,
              backgroundColor: "#f0f0f0",
              borderRadius: 4,
              whiteSpace: "pre-wrap"
            }}
          >
            ↪️ Reply: {msg.reply}
          </div>
        )}

        {msg.fileName ? (
          <div>
            <strong>File:</strong> {msg.fileName}
            <div>
              {msg.fileType && msg.fileType.startsWith("image/") ? (
                <img
                  src={msg.data}
                  alt={msg.fileName}
                  style={{ maxWidth: 250, marginTop: 5 }}
                />
              ) : (
                <a
                  href={msg.data}
                  download={msg.fileName}
                  style={{ color: "#2563eb" }}
                >
                  Download
                </a>
              )}
            </div>
          </div>
        ) : (
          <div>{msg.text}</div>
        )}

        <div className="message-status" style={{ marginTop: 5 }}>
          {(msg.status === "delivered" || msg.status === "read") && (
            <span
              style={{
                color: msg.status === "read" ? "#2563eb" : "gray",
                fontWeight: "bold"
              }}
            >
              ✓✓
            </span>
          )}
        </div>

        {msg.reactions?.length > 0 && (
          <div style={{ marginTop: 5 }}>
            Reactions:{" "}
            {msg.reactions.map((emoji, idx) => (
              <span key={emoji + idx} style={{ marginRight: 6 }}>
                {emoji}
              </span>
            ))}
          </div>
        )}

        <button onClick={onReactClick} style={{ marginTop: 5, marginRight: 10 }}>
          React
        </button>

        {/* New Reply button */}
        <button
          onClick={() => onReply && onReply(msg.id)}
          style={{ marginTop: 5 }}
        >
          Reply
        </button>
      </div>
    </div>
  );
}
