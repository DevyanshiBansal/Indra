import os
import glob
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore  # Updated import
from qdrant_client import QdrantClient
from qdrant_client.http import models
import httpx

# --- Configuration ---
DATA_DIR = "rag_database"
COLLECTION_NAME = "gis_rwh_rag_indra"
QDRANT_URL = "https://de0cf931-a860-4f62-a3b5-258c6dfa7317.europe-west3-0.gcp.cloud.qdrant.io:6333"  
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.7nmUZs4Yhl-_DsIPUpICM11KZp-CkxpfvG_xTO3mm5E"

# Local embedding model path (downloaded model)
EMBEDDING_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "all-MiniLM-L6-v2")

# Batch size for uploading (to avoid timeout)
BATCH_SIZE = 100

def load_pdfs(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)
        print(f"Directory '{directory}' created. Please add PDF files there.")
        return []

    pdf_files = glob.glob(os.path.join(directory, "*.pdf"))
    docs = []
    print(f"Found {len(pdf_files)} PDF files in {directory}...")
    
    for pdf_path in pdf_files:
        try:
            loader = PyPDFLoader(pdf_path)
            docs.extend(loader.load())
            print(f"Loaded: {pdf_path}")
        except Exception as e:
            print(f"Error loading {pdf_path}: {e}")
            
    return docs

def ingest_data():
    # 1. Load Documents
    raw_docs = load_pdfs(DATA_DIR)
    if not raw_docs:
        print("No documents to process. Exiting.")
        return

    # 2. Split Text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(raw_docs)
    print(f"Split documents into {len(chunks)} chunks.")

    # 3. Initialize Embedding Model (using local downloaded model)
    print(f"Initializing Embedding Model from: {EMBEDDING_MODEL_PATH}")
    if not os.path.exists(EMBEDDING_MODEL_PATH):
        print(f"ERROR: Model not found at {EMBEDDING_MODEL_PATH}")
        print("Please ensure the model is downloaded to ./models/all-MiniLM-L6-v2")
        return
    
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL_PATH,
        encode_kwargs={'normalize_embeddings': False}
    )

    # 4. Connect to Qdrant Client with extended timeout
    print("Connecting to Qdrant...")
    client = QdrantClient(
        url=QDRANT_URL, 
        api_key=QDRANT_API_KEY,
        timeout=120  # 2 minute timeout for large uploads
    )

    # 5. Check/Create Collection Safely
    # This prevents the "Unknown arguments: ['init_from']" error
    collections = client.get_collections().collections
    exists = any(c.name == COLLECTION_NAME for c in collections)
    
    if not exists:
        print(f"Collection '{COLLECTION_NAME}' does not exist. Creating...")
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
        )
    else:
        print(f"Collection '{COLLECTION_NAME}' found.")

    # 6. Upload Vectors in batches using updated LangChain wrapper
    print(f"Upserting {len(chunks)} vectors in batches of {BATCH_SIZE}...")
    
    vector_store = QdrantVectorStore(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding=embeddings,
    )
    
    # Upload in batches to avoid timeout
    total_batches = (len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        print(f"  Uploading batch {batch_num}/{total_batches} ({len(batch)} chunks)...")
        try:
            vector_store.add_documents(batch)
        except Exception as e:
            print(f"  Error in batch {batch_num}: {e}")
            print("  Retrying with smaller batch...")
            # Retry with smaller batches
            for j in range(0, len(batch), 20):
                mini_batch = batch[j:j + 20]
                try:
                    vector_store.add_documents(mini_batch)
                except Exception as e2:
                    print(f"  Failed mini-batch: {e2}")
    
    print("Success! Vector database populated for INDRA.")

if __name__ == "__main__":
    ingest_data()