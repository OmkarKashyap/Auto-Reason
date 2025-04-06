# backend/app/core/config.py
import os
import firebase_admin
from firebase_admin import credentials
import logging 

logger = logging.getLogger(__name__)

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_KEY_PATH = os.path.join(APP_DIR, '..', 'admin-sdk-1.json')

_firebase_initialized = False

def initialize_firebase_admin():
    global _firebase_initialized
    if _firebase_initialized:
        logger.info("Firebase Admin SDK already initialized.")
        return

    # Option 1: Prefer environment variable for flexibility (Recommended)
    service_account_key_path_env = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY_PATH')
    if service_account_key_path_env:
        try:
            logger.info(f"Attempting Firebase init from env var path: {service_account_key_path_env}")
            cred = credentials.Certificate(service_account_key_path_env)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully from env var path.")
            _firebase_initialized = True
            return
        except Exception as e:
            logger.error(f"Error initializing Firebase from env var path '{service_account_key_path_env}': {e}")
            # Decide if you want to fall back or raise immediately

    # Option 2: Fallback to default path relative to project structure
    default_path = DEFAULT_KEY_PATH # Use the calculated default path
    if os.path.exists(default_path):
         try:
            logger.info(f"Attempting Firebase init from default file path: {default_path}")
            cred = credentials.Certificate(default_path)
            firebase_admin.initialize_app(cred)
            logger.info(f"Firebase Admin SDK initialized successfully from file: {default_path}")
            _firebase_initialized = True
            return
         except Exception as e:
            logger.error(f"Error initializing Firebase from default file path '{default_path}': {e}")
            # Decide if you want to fall back or raise immediately

    # Option 3: Fallback to Application Default Credentials (ADC)
    try:
        logger.info("Attempting Firebase init with Application Default Credentials (ADC).")
        # No explicit credential needed for ADC
        firebase_admin.initialize_app() # Simpler call for ADC
        logger.info("Firebase Admin SDK initialized successfully with ADC.")
        _firebase_initialized = True
        return
    except Exception as e:
        logger.error(f"Error initializing Firebase Admin SDK with ADC: {e}")

    # If all methods fail
    _firebase_initialized = False
    raise Exception("Could not initialize Firebase Admin SDK. Check logs for details. Ensure key file path or ADC is configured correctly.")

# Remove get_firebase_app() if you only initialize on startup.
# If you NEED it elsewhere, ensure initialize_firebase_admin() has run first.
# def get_firebase_app():
#    if not _firebase_initialized:
#       raise Exception("Firebase not initialized. Call initialize_firebase_admin first.")
#       # Or potentially call initialize_firebase_admin() here, but startup is preferred.
#    return firebase_admin.get_app()