import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

const PhotoCountdown = ({ onPhotoTaken, onClose }) => {
  const [countdown, setCountdown] = useState(3);
  const webcamRef = useRef(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      takePhoto();
    }
  }, [countdown]);

  const takePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onPhotoTaken(imageSrc);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 overflow-hidden">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Please Face Camera</h2>
          <p className="text-4xl font-bold text-blue-600 mt-2">{countdown}</p>
        </div>
        
        <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 480,
              height: 480,
              facingMode: "user"
            }}
            className="rounded-lg w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoCountdown;