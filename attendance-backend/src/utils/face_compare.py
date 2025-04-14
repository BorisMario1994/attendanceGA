import face_recognition
import sys
import json

def compare_faces(reg_photo_path, attendance_photo_path):
    try:
        reg_image = face_recognition.load_image_file(reg_photo_path)
        attendance_image = face_recognition.load_image_file(attendance_photo_path)

        reg_encodings = face_recognition.face_encodings(reg_image)
        att_encodings = face_recognition.face_encodings(attendance_image)

        if not reg_encodings or not att_encodings:
            return {
                'match': False,
                'error': 'No face detected in one or both images',
                'confidence': 0.0
            }

        reg_encoding = reg_encodings[0]
        att_encoding = att_encodings[0]

        distance = face_recognition.face_distance([reg_encoding], att_encoding)[0]
        match = distance <= 0.6
        confidence = 1 - distance

        if distance > 1:
            return 0.0
        confidence = (1.0 - distance) * (1.0 / (1.0 - threshold))
        return round(min(confidence, 1.0), 4)

        return {
            'match': match,
            'confidence': round(confidence, 4),
            'distance': round(distance, 4),
            'error': None
        }

    except Exception as e:
        return {
            'match': False,
            'error': str(e),
            'confidence': 0.0
        }

if __name__ == '__main__':
    reg_photo_path = sys.argv[1]
    attendance_photo_path = sys.argv[2]
    result = compare_faces(reg_photo_path, attendance_photo_path)
    print(json.dumps(result))
