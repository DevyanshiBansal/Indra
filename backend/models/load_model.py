import os
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
SAVE_PATH = ".\\backend\\models\\all-MiniLM-L6-v2"

def download_and_save():
    print(f"⬇Downloading '{MODEL_NAME}'...")
    
    model = SentenceTransformer(MODEL_NAME)
    
    # Create directory if it doesn't exist
    if not os.path.exists(SAVE_PATH):
        os.makedirs(SAVE_PATH)
        
    print(f"Saving model to '{SAVE_PATH}'...")
    model.save(SAVE_PATH)
    
    print("Model saved successfully! You can now use this folder for offline inference.")

if __name__ == "__main__":
    download_and_save()