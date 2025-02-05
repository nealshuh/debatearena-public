export const calculateCumulativeScores = (evaluations) => {
    return evaluations.reduce((acc, evaluation, index) => {
      let scoreChange = evaluation.score;
      if (evaluation.side === "against") {
        scoreChange = -scoreChange; // invert score when "against" side
      }
      const newScore = (index === 0 ? 0 : acc[index - 1]) + scoreChange;
      acc.push(Math.min(Math.max(newScore, -100), 100));
      return acc;
    }, []);
  };
  
  export const getDisplayScore = (score) => score / 10;