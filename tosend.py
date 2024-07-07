import serial
import requests

# Replace with the correct serial port of your RFID reader
SERIAL_PORT = 'COM3'  # Example for Windows, replace with your actual port

# Firebase Realtime Database URL
FIREBASE_URL = 'https://rfid-6f2af-default-rtdb.firebaseio.com/'

# Function to handle RFID scan and send data to Firebase
def handle_rfid_scan(rfid_uid):
    # Construct Firebase database path and payload
    firebase_path = f'attendance/{rfid_uid}'
    firebase_data = {'timestamp': {'.sv': 'timestamp'}}  # Use Firebase Server Timestamp

    # Send PUT request to Firebase
    firebase_response = requests.put(f'{FIREBASE_URL}{firebase_path}.json', json=firebase_data)
    
    if firebase_response.status_code == 200:
        print(f'Successfully logged attendance for RFID: {rfid_uid}')
    else:
        print(f'Failed to log attendance for RFID: {rfid_uid}')

# Main function to listen for RFID scans
def main():
    with serial.Serial(SERIAL_PORT, 9600, timeout=1) as ser:
        while True:
            rfid_uid = ser.readline().strip().decode('utf-8')
            if rfid_uid:
                handle_rfid_scan(rfid_uid)

if __name__ == '__main__':
    main()
