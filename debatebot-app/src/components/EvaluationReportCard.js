import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import "../styles/EvaluationReportCard.css";
import {
  calculateCumulativeScores,
  getDisplayScore,
} from "../utils/scoreUtils";
import { generateDebateSummary } from "../utils/api";
import ReactMarkdown from "react-markdown";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

const EvaluationReportCard = ({
  evaluations,
  topic,
  personaName,
  onClose,
  onHide,
  messages,
  userSide,
  summary,
  setSummary,
}) => {
  useEffect(() => {
    if (!summary && messages.length !== 0) {
      generateSummary();
    }
  }, []);

  const generateSummary = async () => {
    const roundByRoundData = evaluations
      .map((e, index) => {
        const cumulativeScores = calculateCumulativeScores(
          evaluations.slice(0, index + 1)
        );
        const roundScore = getDisplayScore(
          cumulativeScores[cumulativeScores.length - 1]
        );
        return `Round ${index + 1}: ${e.side} - Score: ${roundScore.toFixed(
          3
        )} - ${e.summary}`;
      })
      .join("\n");

    const debateTranscript = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    try {
      const generatedSummary = await generateDebateSummary(
        topic,
        roundByRoundData,
        debateTranscript,
        userSide
      );
      setSummary(generatedSummary);
    } catch (error) {
      console.error("Failed to generate debate summary:", error);
      setSummary("Failed to generate debate summary. Please try again later.");
    }
  };

  const cumulativeScores = calculateCumulativeScores(evaluations);
  const displayScores = cumulativeScores.map(getDisplayScore);

  const maxScore = Math.max(...displayScores.map(Math.abs));
  const axisMax = Math.ceil(maxScore * 1.2); // 20% buffer

  const chartData = {
    labels: evaluations.map((_, index) => `${index + 1}`),
    datasets: [
      {
        label: "Cumulative Score",
        data: displayScores,
        borderColor: (context) => {
          const score = context.raw;
          return score >= 0 ? "rgb(58, 170, 58)" : "rgb(170, 58, 58)";
        },
        segment: {
          borderColor: (context) => {
            const score = context.p1.raw;
            return score >= 0 ? "rgb(58, 170, 58)" : "rgb(170, 58, 58)";
          },
        },
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMin: -axisMax,
        suggestedMax: axisMax,
        ticks: {
          callback: (value) => value.toFixed(1),
        },
        title: {
          display: true,
          text: "Score",
          color: "#fff",
        },
        grid: {
          drawTicks: false,
          color: (context) => (context.tick.value === 0 ? "#666" : "#333"),
          lineWidth: (context) => (context.tick.value === 0 ? 2 : 1),
        },
      },
      x: {
        title: {
          display: true,
          text: "Turn",
          color: "#fff",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      annotation: {
        annotations: {
          forLabel: {
            type: "label",
            yValue: axisMax,
            yAdjust: 10,
            backgroundColor: "transparent",
            content: ["For"],
            color: "rgb(58, 170, 58)",
          },
          againstLabel: {
            type: "label",
            yValue: -axisMax,
            yAdjust: -10,
            backgroundColor: "transparent",
            content: ["Against"],
            color: "rgb(170, 58, 58)",
          },
        },
      },
    },
  };

  return (
    <div className="evaluation-report-card">
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center", 
      }}>
        <button style={{ flexShrink: 0 }} onClick={onHide}>Hide</button>
        <h3 style={{ margin: "0 20px", flexShrink: 1 }}>
          {messages.length === 0 ? (
            <span style={{ color: 'white' }}>Seems like nobody showed up!</span>
          ) : (
            <>
              <span style={{ color: '#00bfff' }}>Winner:</span>
              {' '}
              <span style={{ color: 'white' }}>
                {cumulativeScores[cumulativeScores.length - 1] > 0 ? "You" : (personaName || "AI")}
              </span>
            </>
          )}
        </h3>
        <button style={{ flexShrink: 0 }} onClick={onClose}>New Debate</button>
      </div>
      
      {messages.length > 0 && (
        <>
          <h4 className="topic">
            <span style={{ color: '#00bfff' }}>Topic:</span>
            {' '}
            <span style={{ color: 'white' }}>{topic}</span>
          </h4>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="summary-container">
            <h4>Debate Summary</h4>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
};

export default EvaluationReportCard;
