from pymilvus import MilvusClient, DataType, Collection, connections
from flask import current_app as app
from typing import Dict, List

# client = MilvusClient(uri="tcp://standalone:19530")

class MyMilvusClient:
    def __init__(self, uri):
        self.uri = uri
        self.client = MilvusClient(uri=uri)
        connections.connect(address=uri)

    def setup(self):
        schema = MilvusClient.create_schema(
            auto_id=True,
            enable_dynamic_field=False
        )
        schema.add_field(field_name="id", field_type=DataType.INT64, is_primary=True)
        schema.add_field(field_name="user_id", field_type=DataType.INT32)
        schema.add_field(field_name="embedding", field_type=DataType.FLOAT_VECTOR, dim=1024)
        schema.add_field(field_name="file_id", field_type=DataType.STRING)
        schema.add_field(field_name="segment_id", field_type=DataType.INT32)

        index_params = self.client.prepare_index_params()

        index_params.add_index(
            field_name="user_id",
            index_type="Trie",
        )

        index_params.add_index(
            field_name="embedding",
            index_type="IVF_SQ8",
            metric_type="COSINE",
        )

        self.client.create_collection(collection_name="task", 
                                      schema=schema,
                                      index_params=index_params)
        
        collection = Collection("task")

        collection.set_property(property={
            "mmap.enable": "true"
        })
        

        res = self.client.get_load_state(
            collection_name="task"
        )

        app.logger.info(res)

        res = self.client.describe_collection(
            collection_name="task"
        )

        app.logger.info("collection description:\n" + res)

    def load(self):
        self.client.load_collection(
            collection_name="task"
        )

        res = self.client.get_load_state(
            collection_name="task"
        )

        app.logger.info(res)

    def insert(self, data):
        # milvus have auto save
        self.client.insert(collection_name="task", data=data)

    def get(self, user_id, embedding) -> List[Dict]:
        """
        return the fetched content in json format
        """
        """
        results in format:
        [[
            {
                "id": 1,
                "user_id": 1,
                "embedding": [0.1, 0.2, 0.3, ...],
                "file_id": "file_id",
                "segment_id": 1
            },
            ...
        ]]
        return the fetched content in json format
        """
        results = self.client.search(
            collection_name="task",
            data=[embedding],
            limit=4,
            search_params={"metric_type": "COSINE"},
            filter='user_id == {}'.format(user_id)
        )

        return results
            

     