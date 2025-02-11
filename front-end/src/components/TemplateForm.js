import React, { useState } from 'react';
import styled from 'styled-components';

const FormOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
`;

const FormContainer = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  position: relative;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: bold;
  color: #333;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 12px;
  background: ${props => props.loading ? '#ccc' : '#4CAF50'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: ${props => props.loading ? 'wait' : 'pointer'};
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  
  &:hover {
    background: ${props => props.loading ? '#ccc' : '#45a049'};
  }
`;

const CloseButton = styled.button`
  position: absolute;
  right: 15px;
  top: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;
  
  &:hover {
    color: #666;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TemplateForm = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    rentAmount: '',
    lateFee: '25',
    gracePeroid: '3'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormOverlay>
      <FormContainer>
        <CloseButton onClick={onClose}>×</CloseButton>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Generate New Lease Template</h2>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>Monthly Rent Amount ($)</Label>
            <Input
              type="number"
              value={formData.rentAmount}
              onChange={(e) => setFormData({...formData, rentAmount: e.target.value})}
              required
              min="0"
            />
          </FormGroup>
          <FormGroup>
            <Label>Late Fee Amount ($)</Label>
            <Input
              type="number"
              value={formData.lateFee}
              onChange={(e) => setFormData({...formData, lateFee: e.target.value})}
              required
              min="0"
            />
          </FormGroup>
          <FormGroup>
            <Label>Grace Period (days)</Label>
            <Input
              type="number"
              value={formData.gracePeroid}
              onChange={(e) => setFormData({...formData, gracePeroid: e.target.value})}
              required
              min="0"
            />
          </FormGroup>
          <Button type="submit" loading={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner />
                Generating...
              </>
            ) : (
              'Generate Template'
            )}
          </Button>
        </Form>
      </FormContainer>
    </FormOverlay>
  );
};

export default TemplateForm; 