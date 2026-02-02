import React from 'react';
import Layout from '../components/Layout';

const Tasks: React.FC = () => {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Tasks</h1>
        <div className="card">
          <p className="text-gray-600">Tasks page - Similar structure to Customers page</p>
          <p className="text-sm text-gray-500 mt-2">
            يمكنك تطبيق نفس منطق صفحة Customers هنا مع تعديل الحقول لتناسب المهام
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Tasks;
