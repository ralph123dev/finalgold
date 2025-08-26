import React from "react";

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <div className="navbar">
      <button onClick={() => setActiveTab("channel")}>Channel</button>
      <button onClick={() => setActiveTab("chat")}>Chat</button>
      <button onClick={() => setActiveTab("verify")}>Verify</button>
    </div>
  );
}
