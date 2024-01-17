// FileUploader.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { sleep } from '../utils/sleep';

const uploadServerUrl = import.meta.env.VITE_UPLOAD_URL as string;

if (!uploadServerUrl) {
  throw new Error('Missing env VITE_UPLOAD_URL');
}

const VideoUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'none' | 'pending' | 'done' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file) {
      setUploadStatus('pending');
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(`${uploadServerUrl}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setUploadStatus('done');
        const id = response.data.id;

        // Wait 2 seconds and redirect to the video page
        await sleep(2000);
        window.location.href=`/video/${id}`;
      } catch (error) {
        console.error(error);
        setError(error.response.data || error.message);
        setUploadStatus('error');
      }
    }
  };

  return (
    <div>

        {uploadStatus == 'none' && ( 
            <div>
                <input className='input' type="file" onChange={handleFileChange} />
                <button className='btn' onClick={handleUpload}>Upload</button>
            </div>
        )}

        {uploadStatus == 'pending' && (
            <div>
                Uploading...
                <progress className="progress w-56"></progress>
            </div>
        )}

        {uploadStatus == 'done' && (
            <div>
                Done!
            </div>
        )}

        {uploadStatus == 'error' && (
            <div role="alert" className="alert alert-error">
                Failed to upload file: <pre>{JSON.stringify(error, null, 2)}</pre>
            </div>
        )}

    </div>
  );
};

export default VideoUploader;
