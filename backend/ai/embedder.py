import os
from dotenv import load_dotenv
from llama_index.embeddings.nvidia import NVIDIAEmbedding
from llama_index.core.node_parser import SentenceSplitter
from services.text_processor_service import get_chunks_sentence_range
from typing import List, Tuple

load_dotenv()
api_key = os.getenv("NVIDIA_API_KEY")

embedder = NVIDIAEmbedding(
    model="nvidia/nv-embedqa-e5-v5",
    nvidia_api_key=api_key,
    base_url="https://integrate.api.nvidia.com/v1",
    truncate="END"
)

text_splitter = SentenceSplitter(chunk_size=512, chunk_overlap=128)

def get_embeddings(text: str, metadata: str) -> Tuple[List[str], List[Tuple[int, int]]]:
    """
    return:
        List of embeddings with the text chunk sentence index range
        [embedding, ...], [(start_index, end_index), ...]
    """
    chunks = text_splitter.split_text_metadata_aware(text, metadata)
    embeddings = embedder.get_text_embedding_batch(chunks)
    return embeddings, get_chunks_sentence_range(text, chunks)

def get_indexed_content(text: str, metadata: str, index: int) -> str:
    chunks = text_splitter.split_text_metadata_aware(text, metadata)
    return chunks[index]


if __name__ == "__main__":
    text = "This is a test sentence." * 1000
    metadata = "metadata"
    embeddings = get_embeddings(text, metadata)
    print(embeddings)
    print(len(embeddings))