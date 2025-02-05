import React, { useState, useEffect, useRef } from "react";
import { debounce } from "./utils/debounce";
import { modes } from "./constants/debateModes";
import {
  BLITZ_PROMPT,
  PERSONA_BLITZ_PROMPT,
  STANDARD_PROMPT_WITH_SEARCH,
  STANDARD_PROMPT_WITHOUT_SEARCH,
  DEBATER_SYSTEM_PROMPT,
  DEBATER_USER_PROMPT
} from "./constants/prompts";
import "./styles/App.css";
import SetupPanel from "./components/SetupPanel";
import DebateArena from "./components/DebateArena";
import {
  streamChatCompletion,
  transcribeAudio as transcribeAudioAPI,
  generateSearchQueries,
  searchExa,
  processSearchResults,
  evaluateArgument,
} from "./utils/api";
import BadResponse from "./components/BadResponse";
import EvaluationReportCard from "./components/EvaluationReportCard";

function App() {
  const [topic, setTopic] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("");
  const [side, setSide] = useState("For");
  const [debateStarted, setDebateStarted] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState("Blitz");
  const [currentRound, setCurrentRound] = useState(0);
  const [prepTimeLeft, setPrepTimeLeft] = useState(modes[mode].prepTime);
  const [debateTimeLeft, setDebateTimeLeft] = useState(modes[mode].debateTime);
  const [timerActive, setTimerActive] = useState(false);
  const [turnReady, setTurnReady] = useState(false);
  const [debateConcluded, setDebateConcluded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [allSources, setAllSources] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [showEvaluationReport, setShowEvaluationReport] = useState(false);
  const [evaluationSummary, setEvaluationSummary] = useState("");
  const [globalDebateTime, setGlobalDebateTime] = useState(
    modes.Blitz.globalTime
  );
  const globalTimerRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  // const streamRef = useRef(null);
  const arenaRef = useRef(null);
  const timerRef = useRef(null);
  const chatBoxRef = useRef(null);
  const [invalidAttempts, setInvalidAttempts] = useState(0);
  const [showBadResponse, setShowBadResponse] = useState(false);
  const [isValidResponse, setIsValidResponse] = useState(true);
  const [isInvalidated, setInvalidated] = useState(false);
  const [isUnacceptable, setUnacceptable] = useState(false);
  const [currIsInvalid, setCurrIsInvalid] = useState(false); // boolean to check if invalid debate prompt, so that we dont update evaluation

  useEffect(() => {
    if (currentRound >= modes[mode].rounds.length) {
      setDebateConcluded(true);
      setTimerActive(false);
      setTurnReady(false);
    }
  }, [currentRound, mode]);

  useEffect(() => {
    if (mode === "Blitz" && debateStarted) {
      globalTimerRef.current = setInterval(() => {
        setGlobalDebateTime((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(globalTimerRef.current);
            clearInterval(timerRef.current);
            setDebateConcluded(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (globalTimerRef.current) {
        clearInterval(globalTimerRef.current);
      }
    };
  }, [mode, debateStarted]);

  useEffect(() => {
    if (debateStarted && arenaRef.current) {
      const handleAnimationEnd = () => {
        setAnimationFinished(true);
      };
      arenaRef.current.addEventListener("animationend", handleAnimationEnd);

      return () => {
        if (arenaRef.current) {
          arenaRef.current.removeEventListener(
            "animationend",
            handleAnimationEnd
          );
        }
      };
    }
  }, [debateStarted]);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        if (turnReady) {
          setDebateTimeLeft((prev) => {
            if (prev > 0) {
              return prev - 1;
            } else if (prev >= -1) {
              if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
              } else {
                clearInterval(timerRef.current);
                setAutoSubmit(true);
                return prev;
              }
            } else {
              clearInterval(timerRef.current);
              setAutoSubmit(true);
              return prev;
            }
          });
        } else {
          setPrepTimeLeft((prev) => {
            if (prev > 0) {
              return prev - 1;
            } else {
              setTurnReady(true);
              setTimerActive(false);
              setDebateTimeLeft(modes[mode].debateTime);
              setTimerActive(true);
              return prev;
            }
          });
        }
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, turnReady]);

  useEffect(() => {
    if (autoSubmit) {
      handleSubmit(null);
      setAutoSubmit(false);
    }
  }, [autoSubmit]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    try {
      const transcription = await transcribeAudioAPI(audioBlob);
      setInput((prev) => prev + " " + transcription);
      setAudioBlob(null);
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  };

  useEffect(() => {
    if (audioBlob) {
      transcribeAudio();
    }
  }, [audioBlob]);

  const handleStartDebate = () => {
    if (!topic.trim()) {
      alert("Please enter a topic to start the debate.");
      return;
    }
    setDebateStarted(true);
    setDebateConcluded(false);
    setAnimationFinished(false);
    setMessages([]);
    setEvaluationSummary('');
    setEvaluations([]);

    if (mode === "Blitz") {
      setGlobalDebateTime(modes.Blitz.globalTime);
      setTurnReady(true);
    }
    setPrepTimeLeft(modes[mode].prepTime);
    setDebateTimeLeft(modes[mode].debateTime);
    setCurrentRound(0);
    setTimerActive(true);
    setDebateConcluded(false);
    setInvalidAttempts(0);
    setInvalidated(false);
    setUnacceptable(false);
  };

  const handleNextRound = () => {
    if (mode !== "Blitz") {
      setCurrentRound((prev) => prev + 1);
    }
    setTurnReady(false);
    setPrepTimeLeft(modes[mode].prepTime);
    setDebateTimeLeft(modes[mode].debateTime);
    setTimerActive(true);
    setDebateConcluded(false);
  };

  const handleEndPrep = debounce(() => {
    setTurnReady(true);
    setTimerActive(true);
    setDebateTimeLeft(modes[mode].debateTime);
    setPrepTimeLeft(0);
  }, 250);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (debateConcluded) return;

    const userRole = side.toLowerCase();
    // console.log(userRole);
    const assistantRole = userRole === "for" ? "against" : "for";
    const userMessage = {
      role: `user-${userRole.toLowerCase()}`, // used for css chat styling in DebateArena
      content: input || "(Skipped Turn)",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setTimerActive(false);
    setTurnReady(false); //reset validity for new submission

    // Evaluate user's argument
    // console.log("User Eval");
    const userEvaluation = await evaluateArgument(
      topic,
      messages.slice(-10).map((msg) => msg.content),
      userMessage.content,
      userRole
    );
    setEvaluations((prev) => [...prev, { ...userEvaluation, side: userRole }]);

    try {
      let systemPromptWithContext;
      let userPromptWithContext;
      let modeSpecificGuidelines;
      //   setTimeout(function(){
      //     //do what you need here
      // }, 2000);
      const conversationHistory = messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => `${msg.role.split("-")[0].toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      if (mode === "Blitz") {
        if (selectedPersona) {
          modeSpecificGuidelines = PERSONA_BLITZ_PROMPT.replace(
            "{persona}",
            selectedPersona.name
          ).replace("{personaGuidelines}", selectedPersona.guidelines);
        } else {
          modeSpecificGuidelines = BLITZ_PROMPT;
        }
      } else {
        console.log("Generating search queries...");
        const searchQueries = await generateSearchQueries(
          topic,
          modes[mode].rounds[currentRound].name,
          userMessage.content
        );
        console.log("Generated search queries:", searchQueries);

        // console.log("Performing searches...");
        const searchResults = await Promise.all(
          searchQueries.map((query) => searchExa(query))
        );
        // console.log("Search results received");

        // console.log("Processing search results...");
        const processedResults = searchResults.flatMap(processSearchResults);
        // console.log(`Processed ${processedResults.length} search results`);

        if (processedResults.length > 0) {
          // console.log("Preparing prompt with search results...");
          const topResults = processedResults
            .sort((a, b) => b.score - a.score)
            .slice(0, 3); // Get 3 sources with top scores returned from Exa
          const searchContext = topResults
            .map(
              (result, index) =>
                `[${index + 1}] ${result.title}: ${result.highlight}`
            )
            .join("\n\n");

          setAllSources((prev) => [
            ...prev,
            {
              round: currentRound + 1,
              sources: topResults.map((source) => ({
                title: source.title,
                url: source.url,
              })),
            },
          ]);

          let roundDetails = modes[mode].rounds[currentRound].name;

          modeSpecificGuidelines = STANDARD_PROMPT_WITH_SEARCH.replace(
            "{searchContext}",
            searchContext
          ).replace("{round}", roundDetails);
        } else {
          modeSpecificGuidelines = STANDARD_PROMPT_WITHOUT_SEARCH;
        }
      }
      //At this point the correct prompt has been chosen
      systemPromptWithContext = DEBATER_SYSTEM_PROMPT.replace("{topic}", topic)
        .replace("{assistantRole}", assistantRole)
        .replace("{modeSpecificGuidelines", modeSpecificGuidelines);

      userPromptWithContext = DEBATER_USER_PROMPT.replace("{conversationHistory}", conversationHistory).replace("{userMessage}", userMessage.content);

      // console.log("Streaming chat completion...");
      const stream = await streamChatCompletion(systemPromptWithContext, userPromptWithContext);

      let isInvalid = false;
      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0].delta.content;
        fullResponse += content;

        if (fullResponse.startsWith("INVALID DEBATE PROMPT")) {
          isInvalid = true;
          setIsValidResponse(false);
          setInvalidAttempts((prev) => {
            const newAttempts = prev + 1;
            if (newAttempts >= 3) {
              handleEndDebate();
            }
            return newAttempts;
          });
          setMessages((prev) => prev.slice(0, -2));
          setCurrIsInvalid(true);
          console.log(currIsInvalid)
          setEvaluations((prev) => prev.slice(0, -1));
          // console.log(evaluations);
          setEvaluationSummary("");
          // console.log(evaluationSummary);          
          setShowBadResponse(true);
          break;
        }

        if (fullResponse.startsWith("UNACCEPTABLE DEBATE PROMPT")) {
          isInvalid = true;
          setIsValidResponse(false);
          setShowBadResponse(true);
          setUnacceptable(true);
          handleEndDebate();
          break;
        }

        if(!isInvalid){
          console.log("entered here")
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === `assistant-${assistantRole}`) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: fullResponse },
              ];
            } else {
              return [
                ...prev,
                { role: `assistant-${assistantRole}`, content: fullResponse },
              ];
            }
          });
        }
      }

      console.log("Shoulda broken out with a " + currIsInvalid)

      if (!isInvalid) {
        // evaluate LLM's argument
        // console.log("LLM Eval");
        console.log(currIsInvalid);
        const llmEvaluation = await evaluateArgument(
          topic,
          messages.slice(-11, -1).map((msg) => msg.content),
          fullResponse,
          assistantRole
        );
        // console.log(messages.slice(-11, -1).map((msg) => msg.content));
        setEvaluations((prev) => [
          ...prev,
          { ...llmEvaluation, side: assistantRole },
        ]);
      }
    } catch (error) {
      console.error("Error in debate process:", error);
    } finally {
      setIsStreaming(false);
      if (isValidResponse) {
        if (mode === "Blitz") {
          setDebateTimeLeft(modes.Blitz.debateTime);
          handleNextRound();
        } else if (currentRound < modes[mode].rounds.length - 1) {
          handleNextRound();
        } else {
          setDebateConcluded(true);
          setTimerActive(false);
          setTurnReady(false);
        }
      } else {
        // Reset state for next attempt
        setTurnReady(true);
        setTimerActive(true);
        setDebateTimeLeft(modes[mode].debateTime);
      }
    }
  };

  const handleEndDebate = () => {
    setDebateConcluded(true);
    if (invalidAttempts === 3) {
      setInvalidated(true);
    }
    setTurnReady(false);
    setTimerActive(false);
    if (globalTimerRef.current) {
      clearInterval(globalTimerRef.current);
    }
    setGlobalDebateTime(0);
    setInput("");
    setPrepTimeLeft(0);
    setDebateTimeLeft(0);
    setShowEvaluationReport(true);
  };

  return (
    <div className="App">
      <SetupPanel
        mode={mode}
        setMode={setMode}
        topic={topic}
        setTopic={setTopic}
        side={side}
        setSide={setSide}
        debateStarted={debateStarted}
        handleStartDebate={handleStartDebate}
        setSelectedPersona={setSelectedPersona}
      />
      {debateStarted && (
        <DebateArena
          arenaRef={arenaRef}
          animationFinished={animationFinished}
          side={side}
          topic={topic}
          mode={mode}
          currentRound={currentRound}
          messages={messages}
          chatBoxRef={chatBoxRef}
          turnReady={turnReady}
          debateConcluded={debateConcluded}
          prepTimeLeft={prepTimeLeft}
          debateTimeLeft={debateTimeLeft}
          input={input}
          setInput={setInput}
          isStreaming={isStreaming}
          isRecording={isRecording}
          handleSubmit={handleSubmit}
          handleEndPrep={handleEndPrep}
          startRecording={startRecording}
          stopRecording={stopRecording}
          handleEndDebate={handleEndDebate}
          allSources={allSources}
          globalDebateTime={globalDebateTime}
          evaluations={evaluations}
          showEvaluationReport={showEvaluationReport}
        />
      )}
      {showBadResponse && (
        <BadResponse
          unacceptable={isUnacceptable}
          invalidated={isInvalidated}
          attemptsLeft={invalidAttempts}
          onClose={() => setShowBadResponse(false)}
        />
      )}
      {showEvaluationReport && (
        <EvaluationReportCard
          evaluations={evaluations}
          topic={topic}
          personaName={selectedPersona ? selectedPersona.name : "AI"}
          onClose={() => {
            setShowEvaluationReport(false);
            setEvaluations([]);
            setEvaluationSummary("");
            setMessages([]);
            setSelectedPersona("");
            setTopic("");
            setDebateStarted(false);
            setAnimationFinished(false);
            setAllSources("");
          }}
          onHide={() => setShowEvaluationReport(false)}
          messages={messages}
          userSide={side}
          summary={evaluationSummary}
          setSummary={setEvaluationSummary}
        />
      )}
    </div>
  );
}

export default App;
