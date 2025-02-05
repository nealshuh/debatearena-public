import React, { useState } from "react";
import { Mic, Square } from "lucide-react";
import { modes } from "../constants/debateModes";
import EvaluationBar from "./EvaluationBar";

function DebateArena({
  arenaRef,
  animationFinished,
  side,
  topic,
  mode,
  currentRound,
  messages,
  chatBoxRef,
  turnReady,
  debateConcluded,
  prepTimeLeft,
  debateTimeLeft,
  input,
  setInput,
  isStreaming,
  isRecording,
  handleSubmit,
  handleEndPrep,
  startRecording,
  stopRecording,
  handleEndDebate,
  allSources,
  globalDebateTime,
  evaluations,
  showEvaluationReport
}) {
  const isBlitzMode = mode === "Blitz";

  const [showAdditionalSources, setShowAdditionalSources] = useState(false);

  const toggleAdditionalSources = () => {
    setShowAdditionalSources(!showAdditionalSources);
  };

  const isBlinking = (time) => time <= 3;

  return (
    <div className="debate-arena" ref={arenaRef}>
      <EvaluationBar evaluations={evaluations} />
      {!animationFinished && (
        <div className="loading-message">Generating debate arena...</div>
      )}
      {animationFinished && (
        <>
          <div className="labels">
            <span className={`for-label ${side === "For" ? "active" : ""}`}>
              For
            </span>
            <span
              className={`against-label ${side === "Against" ? "active" : ""}`}
            >
              Against
            </span>
          </div>
          <div className="chat-box" ref={chatBoxRef}>
            <div className="topic-message">
              {topic}
            </div>
            {!isBlitzMode && (
              <div className="round-message">
                {modes[mode].rounds[currentRound].name}
              </div>
            )}
            {messages
              .filter((msg) => msg.role !== "system")
              .map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
          </div>
          <form onSubmit={(e) => handleSubmit(e)} className="argument-form">
            {isBlitzMode ? (
              <div className="timer-display">
                Debate:{" "}
                <span
                  className={isBlinking(globalDebateTime) ? "timer-blink" : ""}
                >
                  {globalDebateTime}s
                </span>
                {turnReady && globalDebateTime > debateTimeLeft && (
                  <div className="turn-time">
                    Turn:{" "}
                    <span
                      className={
                        isBlinking(debateTimeLeft) ? "timer-blink" : ""
                      }
                    >
                      {debateTimeLeft}s
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                {!turnReady && !debateConcluded && (
                  <div className="timer-display">
                    Prep:{" "}
                    <span
                      className={isBlinking(prepTimeLeft) ? "timer-blink" : ""}
                    >
                      {prepTimeLeft}s
                    </span>
                  </div>
                )}
                {turnReady && !debateConcluded && (
                  <div className="timer-display">
                    Debate:{" "}
                    <span
                      className={
                        isBlinking(debateTimeLeft) ? "timer-blink" : ""
                      }
                    >
                      {debateTimeLeft}s
                    </span>
                  </div>
                )}
              </>
            )}
            <textarea
              id="argument-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={
                isStreaming || !turnReady || debateConcluded || isRecording
              }
              placeholder={
                debateConcluded
                  ? "Debate has concluded"
                  : "Type your argument here"
              }
              rows="4"
            />
            {turnReady && !debateConcluded && (
              <div className="recording-controls">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isStreaming || !turnReady || debateConcluded}
                    className="record-button"
                  >
                    <Mic size={24} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="stop-record-button"
                  >
                    <Square size={24} />
                  </button>
                )}
              </div>
            )}
            {!isBlitzMode && !turnReady && !debateConcluded ? (
              <button
                type="button"
                onClick={handleEndPrep}
                disabled={isStreaming || debateConcluded}
              >
                End Prep
              </button>
            ) : (
              <button
                type="submit"
                disabled={
                  isStreaming || !turnReady || debateConcluded || isRecording
                }
              >
                Send
              </button>
            )}
            {!isStreaming ? (
              <div>
                <div className="end-debate" onClick={handleEndDebate}>
                  {!debateConcluded ? "End Debate" : null}
                </div>
                <div className="end-debate" onClick={handleEndDebate}>
                  {debateConcluded && !showEvaluationReport ? "Show Evaluation Report" : null}
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </form>
          {!isBlitzMode && allSources.length > 0 && (
            <div className="all-sources-container">
              <h3>Sources:</h3>
              <div className="sources-grid">
                {allSources.slice(0, 5).map((roundSources, index) => (
                  <div key={index} className="round-sources">
                    <h4>Round {roundSources.round}</h4>
                    <ul>
                      {roundSources.sources.map((source, sourceIndex) => (
                        <li key={sourceIndex}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={source.title}
                          >
                            {source.title.length > 30
                              ? source.title.substring(0, 30) + "..."
                              : source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {allSources.length > 5 && (
                <div className="additional-sources">
                  <button
                    className="additional-sources-button"
                    onClick={toggleAdditionalSources}
                  >
                    {showAdditionalSources ? "Hide" : "Show"} Additional Sources
                  </button>
                  <div
                    className={`sources-grid ${
                      showAdditionalSources ? "" : "hidden"
                    }`}
                  >
                    {allSources.slice(5).map((roundSources, index) => (
                      <div key={index + 5} className="round-sources">
                        <h4>Round {roundSources.round}</h4>
                        <ul>
                          {roundSources.sources.map((source, sourceIndex) => (
                            <li key={sourceIndex}>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={source.title}
                              >
                                {source.title.length > 30
                                  ? source.title.substring(0, 30) + "..."
                                  : source.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DebateArena;
