import React, { useState, useEffect, useRef } from "react";
import { modes } from "../constants/debateModes";
import { personas } from "../constants/personas";
import ContactUs from "./ContactUs";
import { CircleHelp } from "lucide-react";
import { generateDebateTopic } from "../utils/api";
import "../styles/SetupPanel.css";

const SetupPanel = ({
  mode,
  setMode,
  topic,
  setTopic,
  side,
  setSide,
  debateStarted,
  handleStartDebate,
  setSelectedPersona,
}) => {
  const [personaInput, setPersonaInput] = useState("");
  const [showPersonas, setShowPersonas] = useState(false);
  const [showContactUs, setShowContactUs] = useState(false);

  const personaRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (personaRef.current && !personaRef.current.contains(event.target)) {
        setShowPersonas(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAutoSelectTopic = async () => {
    try {
      const newTopic = await generateDebateTopic();
      setTopic(newTopic.replace(/["]+/g, ""));
    } catch (error) {
      console.error("Error generating topic:", error);
      setTopic("Universal Basic Income"); // some default
    }
  };

  const handleAutoSelectPersona = () => {
    const randomPersona = personas[Math.floor(Math.random() * personas.length)];
    setPersonaInput(randomPersona.name);
    setSelectedPersona(randomPersona);
    setShowPersonas(false);
  };

  const handlePersonaSelect = (persona) => {
    setPersonaInput(persona.name);
    setSelectedPersona(persona);
    setShowPersonas(false);
  };

  const filteredPersonas = personas.filter((p) =>
    p.name.toLowerCase().includes(personaInput.toLowerCase())
  );

  return (
    <div className="setup-panel">
      <div className="mode-select">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={debateStarted}
        >
          {Object.entries(modes).map(([modeName, modeData]) => (
            <option key={modeName} value={modeName}>
              {modeName}
            </option>
          ))}
        </select>
      </div>
      <div className="topic-input-container">
        <input
          className={`topic-input ${mode !== "Blitz" ? "wide" : ""}`}
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic (a binary question / stance)"
          disabled={debateStarted}
        />
        <span className="auto-select" onClick={handleAutoSelectTopic}>
          Auto
        </span>
      </div>

      {mode === "Blitz" && (
        <div className="persona-select" ref={personaRef}>
          <input
            type="text"
            value={personaInput}
            onChange={(e) => setPersonaInput(e.target.value)}
            onFocus={() => setShowPersonas(true)}
            placeholder="Select or enter persona"
            disabled={debateStarted}
          />
          <span className="auto-select" onClick={handleAutoSelectPersona}>
            Auto
          </span>
          {showPersonas && (
            <div className="persona-dropdown">
              {filteredPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className="persona-item"
                  onClick={() => handlePersonaSelect(persona)}
                >
                  <div>
                    {/* <img src={persona.avatar}/> */}
                    <span>{persona.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button onClick={handleStartDebate} disabled={debateStarted}>
        Start Debate
      </button>

      <div className="toggle-buttons">
        <button
          className={`for ${side === "For" ? "active" : ""}`}
          onClick={() => !debateStarted && setSide("For")}
          disabled={debateStarted}
        >
          For
        </button>
        <button
          className={`against ${side === "Against" ? "active" : ""}`}
          onClick={() => !debateStarted && setSide("Against")}
          disabled={debateStarted}
        >
          Against
        </button>
      </div>

      <button
        className="contact-button"
        onClick={() => setShowContactUs(true)}
      >
        <CircleHelp size={24} />
      </button>
      {showContactUs && (
        <ContactUs
          onClose={() => setShowContactUs(false)}
        />
      )}
    </div>
  );
};

export default SetupPanel;
