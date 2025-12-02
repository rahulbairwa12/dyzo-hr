import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import { getAuthToken } from '@/utils/authToken';

const ViewComplain = () => {
  const { complainId } = useParams();
  const [complain, setComplain] = useState(null);
  const [loading, setLoading] = useState(true);
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const companyId = useSelector((state) => state?.auth?.user?.companyId);

  useEffect(() => {
    const fetchComplain = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(`${baseURL}/api/complaints/company/${companyId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        const complaint = result.data.find(item => item.id === parseInt(complainId));
        setComplain(complaint);
      } catch (error) {
        console.error('Error fetching complaint data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplain();
  }, [baseURL, companyId, complainId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!complain) {
    return <div>Complaint not found.</div>;
  }

  return (
    <div>
      <div className='flex items-center gap-4'>
        <Icon icon="heroicons-outline:document-text" className='w-6 h-6' />
        <h3 className='text-lg font-semibold'>Complaint Details</h3>
      </div>
      <div className='mt-8'>
        
        <div className='mb-2 mt-2'>
          <strong>Subject -</strong> {complain.subject}
        </div>
        <div className='mb-2 mt-2'>
          <strong>Description -</strong> {complain.description}
        </div>
        <div className='mb-2 mt-2'>
          <strong>Status -</strong> {complain.status}
        </div>
        <div className='mb-2 mt-2'>
          <strong>Created At -</strong> {new Date(complain.created_at).toLocaleString()}
        </div>
        {complain.image && (
          <div className='mb-2 mt-2 flex'>
            <strong>Image -   </strong>
            <img src={`${baseURL}${complain.image}`} alt="Complaint Image" className='pl-4 mt-2 max-h-80' />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewComplain;
