import React from 'react';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dashboard</h2>
      <p className="text-gray-700">Welcome to your Personal Thought Graph dashboard!</p>
      {/* You'll add your graph visualization and interaction elements here */}
    </div>
  );
};

export default Dashboard;