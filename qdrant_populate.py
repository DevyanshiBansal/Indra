import os
import glob
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Qdrant
from qdrant_client import QdrantClient
from qdrant_client.http import models


# --- Configuration ---
DATA_DIR = "rural_rag_data"
COLLECTION_NAME = "gramin_rag"
QDRANT_URL = "https://de0cf931-a860-4f62-a3b5-258c6dfa7317.europe-west3-0.gcp.cloud.qdrant.io:6333"  
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.xJvRurfHh5ReE5Rh5VXsgIz0QIt5tYct319wDnhCCBE"

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

    # 3. Initialize Embedding Model
    print("Initializing Embedding Model...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # 4. Connect to Qdrant Client (Native)
    # We use the native client first to avoid LangChain's version conflict bugs
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

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

    # 6. Upload Vectors using LangChain wrapper
    # We initialize the store with the EXISTING client and collection
    print("Upserting vectors...")
    
    vector_store = Qdrant(
        client=client,
        collection_name=COLLECTION_NAME,
        embeddings=embeddings,
    )
    
    # We use add_documents instead of from_documents to bypass the broken creation logic
    vector_store.add_documents(chunks)
    
    print("Success! Vector database populated for INDRA.")

if __name__ == "__main__":
    ingest_data()