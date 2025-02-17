import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styled from 'styled-components';

const GraphicContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 40px auto;
`;

const StyledCanvas = styled.canvas`
  width: 400px !important;  // Slightly larger
  height: 400px !important; // Slightly larger
  display: block;
`;

const DocumentGraphic = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let animationFrameId;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      canvas: containerRef.current 
    });
    
    renderer.setSize(400, 400); // Match canvas size
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Create document texture with text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 512;
    canvas.height = 640;

    // Background color
    context.fillStyle = '#f5f5f5';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add text content
    context.fillStyle = '#333';
    context.font = 'bold 24px Arial';
    context.fillText('Project Proposal', 40, 50);
    
    context.font = '16px Arial';
    const lines = [
      'Executive Summary:',
      '',
      'This project aims to revolutionize',
      'document management through',
      'AI-powered organization and',
      'intelligent categorization.',
      '',
      'Key Features:',
      '• Smart Timeline',
      '• Voice Assistant',
      '• Email Integration'
    ];

    lines.forEach((line, index) => {
      context.fillText(line, 40, 100 + (index * 30));
    });

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create document mesh with texture
    const geometry = new THREE.PlaneGeometry(2, 2.5);
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      specular: 0x444444,
      shininess: 30
    });
    
    const documentMesh = new THREE.Mesh(geometry, material);
    documentMesh.position.set(0, 0.2, 0); // Slight adjustment up
    scene.add(documentMesh);

    // Add lighting for better 3D effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Adjust camera position for better centering
    camera.position.z = 4;
    camera.position.y = 0.2; // Slight adjustment up

    // Animation
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      if (documentMesh) {
        documentMesh.rotation.y += 0.01;
        documentMesh.position.y = 0.2 + Math.sin(Date.now() * 0.001) * 0.1; // Adjusted floating position
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <GraphicContainer>
      <StyledCanvas ref={containerRef} />
    </GraphicContainer>
  );
};

export default DocumentGraphic; 