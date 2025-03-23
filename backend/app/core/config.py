# backend/app/core/config.py
import os
import firebase_admin
from firebase_admin import credentials

def initialize_firebase_admin():
    """Initializes the Firebase Admin SDK."""
    if not firebase_admin._apps:
        # Option 1: Load credentials from environment variables (recommended for production)
        service_account_key_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
        if service_account_key_str:
            try:
                cred = credentials.Certificate(eval(service_account_key_str))
                firebase_admin.initialize_app(cred)
                print("Firebase Admin SDK initialized from environment variables.")
                return
            except Exception as e:
                print(f"Error initializing Firebase Admin SDK from environment variables: {e}")
                print("Attempting to initialize from file...")

        # Option 2: Load credentials from a JSON file (less secure for production)
        service_account_key_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
        if service_account_key_path:
            try:
                cred = credentials.Certificate(service_account_key_path)
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