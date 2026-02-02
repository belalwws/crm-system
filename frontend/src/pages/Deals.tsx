import React from 'react';
import Layout from '../components/Layout';

const Deals: React.FC = () => {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Deals</h1>
        <div className="card">
          <p className="text-gray-600">Deals page - Similar structure to Customers page</p>
          <p className="text-sm text-gray-500 mt-2">
            يمكنك تطبيق نفس منطق صفحة Customers هنا مع تعديل الحقول لتناسب الصفقات
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Deals;
