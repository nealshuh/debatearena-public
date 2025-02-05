import Together from "together-ai";
import axios from "axios";
import {
  GENERATE_DEBATE_TOPIC_PROMPT,
  GENERATE_SEARCH_QUERIES_PROMPT,
  EVALUATOR_SYSTEM_PROMPT,
  EVALUATOR_USER_PROMPT,
  DEBATE_SUMMARY_PROMPT
} from "../constants/prompts";

const together = new Together({
  apiKey: process.env.REACT_APP_TOGETHER_API_KEY,
});

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

const EXA_API_KEY = process.env.REACT_APP_EXA_API_KEY;

export const generateDebateSummary = async (
  topic,
  roundByRoundData,
  debateTranscript,
  userSide
) => {
  const prompt = DEBATE_SUMMARY_PROMPT
    .replace("{topic}", topic)
    .replace("{roundByRoundData}", roundByRoundData)
    .replace("{debateTranscript}", debateTranscript)
    .replace("{userSide}", userSide);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4, 
        max_tokens: 500,  
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const summary = response.data.choices[0]?.message?.content || "";
    console.log("Generated debate summary:", summary);
    return summary;
  } catch (error) {
    console.error("Error generating debate summary:", error);
    throw error;
  }
};

export const evaluateArgument = async (
  topic,
  previousArguments,
  currentArgument,
  side,
) => {
  const systemPrompt = EVALUATOR_SYSTEM_PROMPT;
  const userPrompt = EVALUATOR_USER_PROMPT.replace("{topic}", topic)
    .replace("{previousArguments}", previousArguments.join("\n"))
    .replace("{currentArgument}", currentArgument)
    .replace("{side}", side);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          },
        ],
        temperature: 0.5,
        max_tokens: 50,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const evaluation = response.data.choices[0]?.message?.content || "";

    if (typeof evaluation !== 'undefined' && evaluation) {
      try {
        const [scoreString, summaryString] = evaluation.split("\n");
        const score = parseFloat(scoreString.split(":")[1]);
        const summary = summaryString ? summaryString.split(":")[1].trim() : '';
        if (!isNaN(score) && summary) {
          console.log(`Evaluation for ${side}:`, { score, summary });
          return { score, summary, side };
        }
        throw new Error("Invalid score or summary");
      } catch (error) {
        console.log("Error parsing evaluation:", error.message);
      }
    }
    console.log(`Evaluation for ${side}:`, { score: 0, summary: "" });
    return { score: 0, summary: "", side };

  } catch (error) {
    console.error("Error evaluating argument:", error);
    throw error;
  }
};

export const generateSearchQueries = async (
  topic,
  currentRound,
  userArgument
) => {
  console.log(
    `Generating search queries for topic: "${topic}", round: "${currentRound}"`
  );
  const prompt = GENERATE_SEARCH_QUERIES_PROMPT.replace(
    "{topic}",
    topic
  ).replace("{userArgument}", userArgument);

  try {
    const response = await together.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "meta-llama/Llama-3-70b-chat-hf",
      max_tokens: 100,
    });

    const queries = response.choices[0].message.content
      .split("\n")
      .filter((q) => q.trim() !== "")
      .filter((q) => q.trim().startsWith("Q:"));

    console.log("Generated search queries:", queries);
    return queries;
  } catch (error) {
    console.error("Error generating search queries:", error);
    throw error;
  }
};

export const searchExa = async (query) => {
  console.log(`Searching Exa API with query: "${query}"`);

  if (!EXA_API_KEY) {
    console.error(
      "Exa API key is not set. Please check your environment variables."
    );
    return [];
  }

  try {
    const response = await axios.post(
      "https://api.exa.ai/search",
      {
        query,
        useAutoprompt: true,
        type: "magic",
        numResults: 3,
        contents: {
          text: {
            maxCharacters: 1000,
            includeHtmlTags: false,
          },
          highlights: {
            numSentences: 3,
            highlightsPerUrl: 3,
          },
        },
      },
      {
        headers: {
          "x-api-key": EXA_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && Array.isArray(response.data.results)) {
      console.log(
        `Exa API returned ${response.data.results.length} results for query: "${query}"`
      );
      return response.data.results;
    } else {
      console.warn("Unexpected response format from Exa API:", response.data);
      return [];
    }
  } catch (error) {
    if (error.response) {
      console.error("Error response from Exa API:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("No response received from Exa API:", error.request);
    } else {
      console.error("Error setting up the request:", error.message);
    }
    return [];
  }
};

export const processSearchResults = (results) => {
  console.log(`Processing ${results.length} search results`);
  if (!Array.isArray(results) || results.length === 0) {
    console.warn("No results to process");
    return [];
  }

  const processedResults = results.map((result) => ({
    score: result.score || 0,
    title: result.title || "Untitled",
    url: result.url || "#",
    highlight:
      result.highlights && result.highlights[0]
        ? result.highlights[0].text
        : "No highlight available",
  }));

  console.log(`Processed ${processedResults.length} search results`);
  return processedResults;
};

export const streamChatCompletion = async (SYSTEM_PROMPT, USER_PROMPT) => {

  const systemPrompt = {
    role: "system",
    content: SYSTEM_PROMPT
  };

  const userPrompt = {
    role: "system",
    content: USER_PROMPT
  };

  const formattedPrompt = [
    systemPrompt,
    userPrompt
  ];

  try {
    const stream = await together.chat.completions.create({
      messages: formattedPrompt,
      model: "meta-llama/Llama-3-70b-chat-hf",
      stream: true,
    });

    console.log("Chat completion stream created successfully");
    return stream;
  } catch (error) {
    console.error("Error streaming response:", error);
    throw error;
  }
};

export const transcribeAudio = async (audioBlob) => {
  console.log("Transcribing audio");
  if (!audioBlob) {
    console.warn("No audio blob provided for transcription");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("language", "en");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: formData,
      }
    );

    const data = await response.json();
    console.log("Audio transcription completed");
    return data.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
};

// Simple cache to store recent topics
const recentTopics = [];
const MAX_RECENT_TOPICS = 5;

export const generateDebateTopic = async () => {
  const systemMessage = "Generate a unique debate topic. Avoid topics similar to these recent ones: " + recentTopics.join(", ");
  
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: GENERATE_DEBATE_TOPIC_PROMPT,
          },
        ],
        temperature: 0.9, 
        max_tokens: 50,
        top_p: 0.95,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let topic = response.data.choices[0]?.message?.content || "";
    topic = topic.trim();

    // check if the topic is too similar to recent ones
    if (recentTopics.some(recentTopic => 
        recentTopic.toLowerCase().includes(topic.toLowerCase()) || 
        topic.toLowerCase().includes(recentTopic.toLowerCase()))) {
      console.log("Generated topic too similar to recent ones. Retrying...");
      return generateDebateTopic(); // recursive call to try again
    }

    // add the new topic to recent topics
    recentTopics.unshift(topic);
    if (recentTopics.length > MAX_RECENT_TOPICS) {
      recentTopics.pop();
    }

    console.log("Generated debate topic:", topic);
    return topic;
  } catch (error) {
    console.error("Error generating debate topic:", error);
    throw error;
  }
};
