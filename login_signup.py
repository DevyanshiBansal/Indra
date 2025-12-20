# Imports (firebase_admin, requests)

# 1. SETUP
# Initialize Firebase Admin with JSON key
# Define API Key for Login (from Firebase Console settings)

# 2. AUTH FUNCTION
passw = ""
def login_user(email, passw):
    ""
    # Hit REST API
    # Return Token

# 3. CRUD FUNCTIONS
def add_rainwater_data(data):
    ""
    # db.collection(...).add(data)

def get_user_data(user_id):
    ""
    # db.collection(...).doc(user_id).get()

# 4. MAIN EXECUTION (The "Menu")
if __name__ == "__main__":
    ""
    # Ask user: Login or Signup?
    # If Login success -> Show Menu:
        # 1. Add Data
        # 2. View Data
        # 3. Update Data
        
        
        
        
import firebase_admin
from firebase_admin import credentials

cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)


