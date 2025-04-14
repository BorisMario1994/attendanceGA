import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';

const WebcamCapture = ({ onCapture, onClose }) => {
  const webcamRef = useRef(null);
  const [error, setError] = useState('');

  const videoConstraints = {
    width: 480,
    height: 480,
    facingMode: "user"
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [onCapture]);

  const handleUserMediaError = useCallback(() => {
    setError('Could not access webcam. Please make sure you have granted camera permissions.');
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Take Registration Photo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMediaError={handleUserMediaError}
                className="rounded-lg w-full h-full object-cover"
              />
            </div>
            <button
              onClick={capture}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Capture Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;