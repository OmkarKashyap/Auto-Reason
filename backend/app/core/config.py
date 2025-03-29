# backend/app/core/config.py
import os
import firebase_admin
from firebase_admin import credentials

def initialize_firebase_admin():
    service_account_key_path = 'admin-sdk-1.json'
    if service_account_key_path:
        try:
            cred = credentials.Certificate('admin-sdk-1.json')
            firebase_admin.initialize_app(cred)
            print(f"Firebase Admin SDK initialized from file: {service_account_key_path}")
            return
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK from file: {e}")

    # If neither environment variable is set, try default initialization (might work in some local setups)
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized with Application Default credentials.")
        return
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK with Application Default credentials: {e}")
        raise Exception("Could not initialize Firebase Admin SDK. Ensure FIREBASE_SERVICE_ACCOUNT_KEY_JSON or FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable is set correctly.")
    else:
        print("Firebase Admin SDK already initialized.")

def get_firebase_app():
    """Returns the initialized Firebase app instance."""
    if not firebase_admin._apps:
        initialize_firebase_admin()
    return firebase_admin.get_app()