// FileUploader.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { sleep } from '../utils/sleep';
import { swrApi } from '../api';

const uploadServerUrl = import.meta.env.VITE_UPLOAD_URL as string;

if (!uploadServerUrl) {
  throw new Error('Missing env VITE_UPLOAD_URL');
}

const VideoUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'none' | 'pending' | 'done' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);
  const { data: linkInfo, error: linkError, isMutating: isLinkLoading, trigger: triggerLinkUpload } = swrApi.videoProcessLink.useSWRMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {

    if (link) {
      setUploadStatus('pending');
      const res = await triggerLinkUpload({ link });
      window.location.href = `/video/${res.id}`;
      return;
    }


    if (file) {
      setUploadStatus('pending');
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(`${uploadServerUrl}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setUploadStatus('done');
        const id = response.data.id;

        // Wait 2 seconds and redirect to the video page
        await sleep(2000);
        window.location.href = `/video/${id}`;
      } catch (error) {
        console.error(error);
        setError(error.response.data || error.message);
        setUploadStatus('error');
      }
    }
  };

  return (
    <div className='flex flex-col h-full justify-center'>

      {uploadStatus == 'none' && (
        <>
          <div className="grid card p-10 bg-base-300 rounded-box place-items-center space-y-10">
            <h2>Select a video file</h2>
            <input className='input p-2' type="file" onChange={handleFileChange} />
          </div>
          <div className="divider">OR</div>
          <div className="grid p-10 card bg-base-300 rounded-box place-items-center space-y-10">
            <h2>Insert a Twitch link</h2>
            <input className='input' value={link} onChange={e => setLink(e.currentTarget.value)}/>
          </div>
          
            <button className='btn btn-primary mt-10' onClick={handleUpload}>Upload</button>
        </>
      )}

      {uploadStatus == 'pending' && (
        <div className='text-center'>
          <div>Uploading...</div>
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
