import React from 'react';
import '../styles/App.css';

const ContactUs = ({onClose }) => {
    return (
      <div className="card-overlay">
        <div className="card-content">
            <button className="close-button" onClick={onClose}>×</button>
            <p><span style={{ color: '#00bfff' }}>Blitz:</span> 5 minutes total, 30 seconds per argument, <span style={{fontWeight: 'bold'}}>debate against personas</span></p>
            <p><span style={{ color: '#00bfff' }}>Standard:</span> 1 minute prep, 2 mins per argument, 3 rounds in total, <span style={{fontWeight: 'bold'}}>AI cites sources</span></p>
            <hr />
            <p>Thank you for trying out our demo.</p>
            <p>Please reach out on <a style={{color: '#00bfff'}} href='https://discord.gg/QCSApQ33'>Discord</a> for any feature requests, feedback or bugs.</p>
            <p><span style={{ fontWeight: 'bold',   color: '#00bfff' }}>Coming Soon:</span> Cross-Examination mode, Improved Standard format, Saving debates and tracking progress</p>
        </div>
      </div>
    );
  };

export default ContactUs;