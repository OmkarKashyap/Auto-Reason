"use client";
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import LandingPage from '../components/LandingPage';
import Dashboard from '../components/Dashboard';

const Home: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Placeholder for authentication

  return (
    <div>
      <Navbar />
      {isLoggedIn ? <Dashboard /> : <LandingPage />}
    </div>
  );
};

export default Home;