import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  background-color: black;
  min-height: 100vh;
  color: white;
  overflow-x: hidden;
`;

const Section = styled.section`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  opacity: 0;
  transform: translateX(${props => props.index % 2 === 0 ? '-100px' : '100px'});
  transition: all 1s ease-out;

  &.visible {
    opacity: 1;
    transform: translateX(0);
  }
`;

const WaitlistSection = styled(Section)`
  background: linear-gradient(45deg, rgba(74, 144, 226, 0.1), rgba(0, 0, 0, 0.3));
  min-height: 60vh;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, transparent 0%, black 70%);
    pointer-events: none;
  }
`;

const Content = styled.div`
  max-width: 800px;
  text-align: ${props => props.index % 2 === 0 ? 'left' : 'right'};
`;

const Title = styled.h1`
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(45deg, #fff, #888);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  color: #ccc;
`;

const Button = styled.button`
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: linear-gradient(45deg, #d3d3d3, #a9a9a9);
  border: none;
  border-radius: 30px;
  color: white;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const WaitlistForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 500px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  }
`;

const SuccessMessage = styled.div`
  color: #4CAF50;
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(76, 175, 80, 0.1);
  margin-top: 1rem;
`;

const ErrorMessage = styled(SuccessMessage)`
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
`;

const sections = [
  {
    title: "Document Timeline",
    description: "Experience your documents in a whole new way. Our interactive timeline brings your document history to life with a beautiful, intuitive interface."
  },
  {
    title: "Smart Organization",
    description: "Let AI handle the organization. Our system automatically categorizes and arranges your documents, making them easy to find when you need them."
  },
  {
    title: "Voice Assistance",
    description: "Interact with your documents naturally. Our voice assistant helps you navigate and understand your documents with simple voice commands."
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const sectionRefs = useRef([]);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.3,
      }
    );

    sectionRefs.current.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to join waitlist');

      setSubmitStatus({
        type: 'success',
        message: 'Thank you for joining our waitlist! We\'ll be in touch soon.'
      });
      setEmail('');
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to join waitlist. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>

<Section ref={el => sectionRefs.current[4] = el} index={4}>
        <Content index={4}>
          <Title>Get Started</Title>
          <Description>
            Join us in revolutionizing document management. Experience the future today.
          </Description>
        </Content>
      </Section>
      
      {sections.map((section, index) => (
        <Section
          key={index}
          ref={el => sectionRefs.current[index] = el}
          index={index}
        >
          <Content index={index}>
            <Title>{section.title}</Title>
            <Description>{section.description}</Description>
          </Content>
        </Section>
      ))}

      <WaitlistSection ref={el => sectionRefs.current[3] = el} index={3}>
        <Content index={3}>
          <Title style={{ textAlign: 'center' }}>Join the Waitlist</Title>
          <Description style={{ textAlign: 'center' }}>
            Be among the first to experience the future of document management.
          </Description>
          <WaitlistForm onSubmit={handleWaitlistSubmit}>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </Button>
            {submitStatus && (
              submitStatus.type === 'success' ? (
                <SuccessMessage>{submitStatus.message}</SuccessMessage>
              ) : (
                <ErrorMessage>{submitStatus.message}</ErrorMessage>
              )
            )}
          </WaitlistForm>
        </Content>
      </WaitlistSection>


    </Container>
  );
};

export default LandingPage;
