export const modes = {
    Standard: {
      prepTime: 60,
      debateTime: 120,
      rounds: [
        { name: "Round 1: Opening", description: "Standard Opening Round" },
        { name: "Round 2: Rebuttals", description: "Standard Rebuttal Round" },
        { name: "Round 3: Closing", description: "Standard Closing Round" },
      ],
    },
    Blitz: {
      globalTime: 360, 
      debateTime: 60, 
      rounds: []  
    }
  };