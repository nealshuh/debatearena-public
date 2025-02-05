import React from 'react';
import '../styles/App.css';

const BadResponse = ({ unacceptable, invalidated, attemptsLeft, onClose }) => {
    return (
      <div className="card-overlay">
        {
            unacceptable && 
            <div className="card-content">
             <button className="close-button" onClick={onClose}>×</button>
             <p>Please do not try to break the LLM!</p>
             <p>If you are having an emergency, please take immediate action:
                Call 911 for urgent medical, fire, or police assistance.
                National Suicide Prevention Lifeline: 1-800-273-8255 (24/7 support).
                Crisis Text Line: Text HOME to 741741 for free, 24/7 crisis support.</p>
           </div>
        }
        {
            !unacceptable && invalidated && 
            <div className="card-content">
             <button className="close-button" onClick={onClose}>×</button>
             <p>Please stay on topic.</p>
             <p>If you input {(3 - attemptsLeft).toString()} more unrelated responses, you will automatically forfeit this debate. Try again.</p>
             <p>Invalid Attempt {(attemptsLeft).toString()}/3</p>
           </div>
        }
        { !unacceptable && (attemptsLeft !== 3 && !invalidated) && 
             <div className="card-content">
             <button className="close-button" onClick={onClose}>×</button>
             <p>Please stay on topic.</p>
             <p>If you input {(3 - attemptsLeft).toString()} more unrelated responses, you will automatically forfeit this debate. Try again.</p>
             <p>Invalid Attempt {(attemptsLeft).toString()}/3</p>
           </div> }
        {  !unacceptable && (attemptsLeft === 3 && !invalidated) &&
            <div className="card-content">
            <button className="close-button" onClick={onClose}>×</button>
            <p>You have been removed from this session.</p>
            <p>Please stay on topic next debate, you will be removed again for getting off track.</p>
          </div> }
      </div>
    );
  };

export default BadResponse;