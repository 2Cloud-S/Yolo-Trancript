import React from 'react';

const UpvoteClubLogo: React.FC = () => (
  <a 
    href="https://upvote.club/?invite=1b09fa5a" 
    target="_blank" 
    rel="noopener noreferrer"
    className="block hover:opacity-80 transition-opacity"
  >
    <img 
      src="https://upvote.club/upvoteclub-logo.png" 
      alt="Upvote Club" 
      width={200} 
      height={40} 
      className="rounded-lg"
    />
  </a>
);

export default UpvoteClubLogo; 