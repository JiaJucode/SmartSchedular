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
    if len(text) == 0:
        return [], []
    chunks = text_splitter.split_text_metadata_aware(text, metadata + " at 200-300: ")
    ranges = get_chunks_sentence_range(text, chunks)
    chunks_with_metadata = [f"{metadata} at {ranges[i][0]}-{ranges[i][1]}: {chunk}"
                            for i, chunk in enumerate(chunks)]
    embeddings = embedder.get_text_embedding_batch(chunks_with_metadata)
    return embeddings, ranges

if __name__ == "__main__":
    text = "This is a test sentence." * 1000
    metadata = "metadata"
    embeddings = get_embeddings(text, metadata)
    print(embeddings)
    print(len(embeddings))