import React, { useState, useEffect } from "react";
import "../styles/EvaluationBar.css";
import { calculateCumulativeScores, getDisplayScore } from "../utils/scoreUtils";

const EvaluationBar = ({ evaluations }) => {
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [currentSummary, setCurrentSummary] = useState("");

  useEffect(() => {
    if (evaluations.length > 0) {
      const scores = calculateCumulativeScores(evaluations);
      setCumulativeScore(scores[scores.length - 1]);
      setCurrentSummary(evaluations[evaluations.length - 1].summary);
    }
  }, [evaluations]);

  // amplify the movement by using a non-linear transformation
  const amplifiedPercentage =
    (Math.sign(cumulativeScore) *
      Math.pow(Math.abs(cumulativeScore) / 100, 0.7) +
      1) *
    50;

  const isForWinning = cumulativeScore >= 0;
  const displayScore = getDisplayScore(cumulativeScore);

  return (
    <div className="evaluation-bar-container">
      <div className="evaluation-bar">
        <div
          className="evaluation-bar-fill"
          style={{ width: `${amplifiedPercentage}%` }}
        >
          {isForWinning && (
            <span className="score-display score-display-for">
              {displayScore.toFixed(1)}
            </span>
          )}
        </div>
        {!isForWinning && (
          <span className="score-display score-display-against">
            {displayScore.toFixed(1)}
          </span>
        )}
      </div>
      <div className="evaluation-summary">{currentSummary}</div>
    </div>
  );
};

export default EvaluationBar;