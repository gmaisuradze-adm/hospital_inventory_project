import React from 'react';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="mt-4 text-gray-600">This page is under development.</p>
  </div>
);

export const UserProfile = () => <PlaceholderPage title="User Profile" />;
export const InventoryDetails = () => <PlaceholderPage title="Inventory Details" />;
export const AddInventoryItem = () => <PlaceholderPage title="Add Inventory Item" />;
export const EditInventoryItem = () => <PlaceholderPage title="Edit Inventory Item" />;
export default PlaceholderPage;