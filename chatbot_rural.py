import os
import sys

# --- 1. CONFIGURATION (PASTE KEYS HERE) ---
# Replace these with your actual keys
QDRANT_URL = "https://50052f68-a3f2-4fce-91b2-9e140737db61.us-east4-0.gcp.cloud.qdrant.io"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.5XzTwGgID_B55AVH-lIM9QYK2PEceMbMkcUMHWCgTDU"
OPENROUTER_API_KEY = "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"

# This MUST match the collection name you used in your ingestion script
COLLECTION_NAME = "standrd_rag" 

# --- 2. IMPORTS ---
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    # UPDATED IMPORT: Using the official partner package
    from langchain_qdrant import QdrantVectorStore
    from qdrant_client import QdrantClient
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.runnables import RunnablePassthrough
except ImportError as e:
    print("❌ Error: Missing libraries. Run this command:")
    print("pip install langchain-huggingface langchain-qdrant qdrant-client langchain-openai")
    sys.exit(1)

# --- 3. SYSTEM PROMPT (The "Indra" Personality) ---
SYSTEM_TEMPLATE = """
You are 'Indra', the specialized AI assistant for the Indra Rainwater Harvesting Platform. 
Your mission is to help users adopt sustainable water practices, specifically focusing on Rainwater Harvesting (RWH), Rural Crop Management, and Water Farming.

DOMAIN BOUNDARIES (STRICT):
1. You are an expert ONLY in:
   - Rainwater Harvesting Systems (Design, Cost, Maintenance).
   - Water conservation techniques for rural and urban homes.
   - Crop selection based on water availability.
   - Ground water recharge and tank storage.
   
2. IF the user asks about anything else (e.g., politics, movies, coding, general knowledge, sports):
   - You MUST politely decline.
   - Example Refusal: "I apologize, but I am specialized only in Rainwater Harvesting and Agricultural Water Management. I cannot assist with that topic. Is there anything about water conservation I can help you with?"

3. BEHAVIOR:
   - Be encouraging, practical, and precise.
   - When discussing costs, mention that estimates depend on roof area and location.
   - Use the Context provided below to answer accurately.

CONTEXT FROM DATABASE:
{context}

USER QUESTION: 
{question}
"""

def start_indra_bot():
    print("\n💧 Initializing Indra AI (Llama 3.3 70B)...")

    # --- Step A: Connect to Database (Qdrant) ---
    print("   - Loading Embedding Model (MiniLM-L6)...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    print("   - Connecting to Qdrant Cloud...")
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    
    # Check if collection exists
    collections = client.get_collections().collections
    if not any(c.name == COLLECTION_NAME for c in collections):
        print(f"\n❌ Error: Collection '{COLLECTION_NAME}' not found in Qdrant!")
        print("   Did you run your ingestion script first?")
        return

    # UPDATED INITIALIZATION: This is the stable modern method
    print("   - hooking into Vector Store...")
    vector_store = QdrantVectorStore.from_existing_collection(
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY
    )
    
    # Retrieve top 3 relevant chunks
    # Note: 'search_kwargs' is the correct parameter for passing 'k'
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})

    # --- Step B: Connect to Brain (OpenRouter Llama) ---
    print("   - Connecting to OpenRouter (Llama 3.3)...")
    llm = ChatOpenAI(
        model="meta-llama/llama-3.3-70b-instruct:free",
        openai_api_key=OPENROUTER_API_KEY,
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0.3,
        max_tokens=1024
    )

    # --- Step C: Build the Processing Chain ---
    prompt = ChatPromptTemplate.from_template(SYSTEM_TEMPLATE)
    
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    # --- Step D: Start Chat Loop ---
    print("\n✅ Indra is Online! Ask about Rainwater Harvesting. (Type 'exit' to quit)\n")
    
    while True:
        try:
            user_input = input("User: ")
            if user_input.lower() in ["exit", "quit"]:
                print("Indra: Goodbye! Save water! 💧")
                break
            
            if not user_input.strip():
                continue

            print("Indra: ", end="", flush=True)
            
            # Stream the answer token by token
            for chunk in rag_chain.stream(user_input):
                print(chunk, end="", flush=True)
            print("\n")
            
        except Exception as e:
            print(f"\n❌ Error during chat: {e}")

if __name__ == "__main__":
    if "your_" in OPENROUTER_API_KEY:
         print("⚠️  WARNING: You haven't pasted your OpenRouter API Key in line 7!")
    start_indra_bot()