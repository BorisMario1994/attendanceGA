import sys
import json
import logging
import cv2
import requests
from pathlib import Path
import base64
from random import uniform
import time

# Setup logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Add these constants after the existing ones
MAX_RETRIES = 5
INITIAL_BACKOFF = 5  # Initial backoff time in seconds

# Replace with your Face++ API Key and API Secret
API_KEY = 'juQEiPiGXu3w3BW6RJg8FfAF4T_vJz1i'
API_SECRET = 'AqaWWXRP1i_u7b95rB1jQgY_863RahlS'

def encode_image_to_base64(image_path):
    """ Helper function to convert image to base64 string """
    try:
        with open(image_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
        return encoded_image
    except Exception as e:
        logging.error(f"Error encoding image to base64: {str(e)}", exc_info=True)
        return None


def exponential_backoff(attempt):
    """Calculate exponential backoff with jitter"""
    backoff = INITIAL_BACKOFF * (2 ** attempt)
    jitter = uniform(0, 0.1 * backoff)  # Add 0-10% jitter
    return backoff + jitter

def compare_faces(reg_photo_path, attendance_photo_path):
    attempt = 0
    while attempt < MAX_RETRIES:
        try:
            # Convert images to base64
            reg_image_base64 = encode_image_to_base64(reg_photo_path)
            attendance_image_base64 = encode_image_to_base64(attendance_photo_path)

            if not reg_image_base64 or not attendance_image_base64:
                return {
                    'match': False,
                    'error': 'Failed to encode images',
                    'confidence': 0.0
                }

            # Prepare Face++ API request parameters
            url = 'https://api-us.faceplusplus.com/facepp/v3/compare'
            data = {
                'api_key': API_KEY,
                'api_secret': API_SECRET,
                'image_base64_1': reg_image_base64,
                'image_base64_2': attendance_image_base64
            }

            # Make the API request
            response = requests.post(url, data=data)
            result = response.json()

            # Check for concurrency limit error
            if 'error_message' in result and 'CONCURRENCY_LIMIT_EXCEEDED' in result['error_message']:
                if attempt < MAX_RETRIES - 1:
                    backoff_time = exponential_backoff(attempt)
                    logging.warning(f"Concurrency limit exceeded. Retrying in {backoff_time:.2f} seconds...")
                    time.sleep(backoff_time)
                    attempt += 1
                    continue
                else:
                    return {
                        'match': False,
                        'error': 'Service temporarily unavailable due to high traffic',
                        'confidence': 0.0
                    }
            
            # Handle other API errors
            if 'error_message' in result:
                return {
                    'match': False,
                    'error': result['error_message'],
                    'confidence': 0.0
                }

            # Get the similarity score from the response
            confidence = result.get('confidence', 0.0)
            match = confidence >= 80  # You can adjust this threshold as needed
            
            logging.debug(f"Face comparison result: {result}")
            
            return {
                'match': match,
                'confidence': confidence/100,
                'error': None
            }
        
        except Exception as e:
            logging.error("Exception occurred during face comparison.", exc_info=True)
            if attempt < MAX_RETRIES - 1:
                backoff_time = exponential_backoff(attempt)
                logging.warning(f"Retrying in {backoff_time:.2f} seconds...")
                time.sleep(backoff_time)
                attempt += 1
            else:
                return {
                    'match': False,
                    'error': str(e),
                    'confidence': 0.0
                }

if __name__ == '__main__':
    try:
        logging.debug("hello")
        reg_photo_path = sys.argv[1]
        attendance_photo_path = sys.argv[2]
        result = compare_faces(reg_photo_path, attendance_photo_path)
        print(json.dumps(result))
    except Exception as e:
        logging.error(f"Script execution failed: {str(e)}", exc_info=True)
        print(json.dumps({
            'match': False,
            'error': str(e),
            'confidence': 0.0
        }))
        sys.exit(1)
