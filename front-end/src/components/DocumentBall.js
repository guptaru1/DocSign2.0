import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Ball = styled.div`
  width: 100px;
  height: 100px;
  background: radial-gradient(
    circle at 30% 30%,
    #a0a0a0,
    #808080 30%,
    #505050 100%
  );
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease-out;
  box-shadow: 
    inset -8px -8px 12px rgba(0,0,0,0.4),
    inset 8px 8px 12px rgba(255,255,255,0.4),
    4px 4px 8px rgba(0,0,0,0.6);
  
  &::before {
    content: '';
    position: absolute;
    width: 40%;
    height: 40%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255,255,255,0.8),
      rgba(255,255,255,0.1) 60%,
      transparent 100%
    );
    border-radius: 50%;
    top: 20%;
    left: 20%;
    filter: blur(2px);
  }

  &:hover {
    transform: scale(1.1) translateY(-5px);
    box-shadow: 
      inset -8px -8px 12px rgba(0,0,0,0.4),
      inset 8px 8px 12px rgba(255,255,255,0.4),
      8px 8px 16px rgba(0,0,0,0.6);
  }

  &:active {
    transform: scale(1.05) translateY(-2px);
    box-shadow: 
      inset -4px -4px 8px rgba(0,0,0,0.4),
      inset 4px 4px 8px rgba(255,255,255,0.4),
      4px 4px 8px rgba(0,0,0,0.6);
  }

  span {
    color: white;
    text-align: center;
    padding: 10px;
    font-size: 14px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    z-index: 1;
    font-weight: bold;
  }
`;

const BallContainer = styled.div`
  position: relative;
  perspective: 1000px;
  transform-style: preserve-3d;
  transform: translateX(${props => props.isLeft ? '-50px' : '50px'});

  &:hover ${Ball} {
    transform: rotateY(${props => props.isLeft ? '-10deg' : '10deg'}) 
              rotateX(5deg) 
              scale(1.1) 
              translateY(-5px);
  }
`;

const DocumentBall = ({ document, isVisible, isLeft }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/document/${document.id}`);
  };

  return (
    <BallContainer isLeft={isLeft}>
      <Ball 
        className="document-ball"
        data-doc-id={document.id}
        onClick={handleClick}
      >
        <span>{document.title}</span>
      </Ball>
    </BallContainer>
  );
};

export default DocumentBall; 