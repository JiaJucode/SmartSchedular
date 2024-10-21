from pymilvus import MilvusClient, DataType, Collection, connections, utility
from pymilvus.exceptions import MilvusException
from typing import Dict, List
from flask import current_app as app
import time
import threading

class MyMilvusClient:
    def __init__(self):
        self.client = MilvusClient("tcp://milvus-standalone:19530")
        connections.connect("default", host="milvus-standalone", port="19530")
        self.next_id = 0
        self.id_lock = threading.Lock()

    def setup(self):
        schema = MilvusClient.create_schema(
            auto_id=False,
            enable_dynamic_field=False
        )
        schema.add_field(field_name="id", datatype=DataType.INT64, is_primary=True)
        schema.add_field(field_name="user_id", datatype=DataType.INT32)
        schema.add_field(field_name="embedding", datatype=DataType.FLOAT_VECTOR, dim=1024)
        schema.add_field(field_name="file_id", datatype=DataType.VARCHAR, max_length=44) # for google drive file id
        schema.add_field(field_name="segment_id", datatype=DataType.INT32)

        index_params = self.client.prepare_index_params()

        index_params.add_index(
            field_name="embedding",
            index_type="IVF_SQ8",
            metric_type="COSINE",
            nlist=64
        )

        if not self.client.has_collection("task"):
            self.client.create_collection(
                collection_name="task", 
                schema=schema,
                index_params=index_params)
        else:
            res = self.client.describe_collection("task")
            print("current collection description: " + str(res))
            print("schema: " + str(schema.to_dict()))
            equal = True
            schema_dict = schema.to_dict()
            for field in schema_dict:
                if field not in res:
                    equal = False
                    break
                if type(schema_dict[field]) is list:
                    if len(schema_dict[field]) != len(res[field]):
                        equal = False
                        break
                    for i in range(len(schema_dict[field])):
                        difference = [item for item in schema_dict[field][i] 
                                    if item not in res[field][i] 
                                    or res[field][i][item] != schema_dict[field][i][item]]
                        difference = [ item for item in difference if item != 'auto_id']
                        if len(difference) > 0:
                            equal = False
                            break
                else:
                    if res[field] != schema_dict[field]:
                        equal = False
                        break

            if not equal:
                print("schema not match, drop and recreate collection")
                self.client.drop_collection("task")
                self.client.create_collection(
                    collection_name="task", 
                    schema=schema,
                    index_params=index_params)

        collection = Collection("task")
        for i in range(5):
            try:
                collection.set_properties(properties={
                    "mmap.enable": "true"
                })
                break
            except MilvusException as e:
                time.sleep(5)

        self.client.load_collection(
            collection_name="task"
        )
        print("collection description: " + str(res))

    def inserts(self, user_id: int, embeddings: List[List[float]], file_id: str):
        # check if file for user_id already exists
        results = self.client.query(
            collection_name="task",
            filter='user_id == {} && file_id == "{}"'.format(user_id, file_id),
            limit=len(embeddings)
        )
        next_ids = []
        with self.id_lock:
            next_ids = list(range(self.next_id, self.next_id + len(embeddings)))
            self.next_id += len(embeddings)
        data = []
        for i in range(len(embeddings)):
            data.append({
                "id": next_ids[i],
                "user_id": user_id,
                "embedding": embeddings[i],
                "file_id": file_id,
                "segment_id": i
            })
        for result in results:
            index = result["segment_id"]
            data[index]["id"] = result["id"]
            
        insert_result = self.client.upsert(
            collection_name="task",
            data=data
        )
        if insert_result["upsert_count"] != len(embeddings):
            app.logger.info("insert partial failed, should insert {} but only inserted {}"
                            .format(len(embeddings), insert_result["upsert_count"]))
        else:
            app.logger.info("insert success")

    def get(self, user_id: int, embedding: List[float], difference_threshold: int = 0.5) -> List[Dict]:
        """
        return the fetched content in json format
        """
        """
        results in format:
        [
            {
                "id": 1,
                "user_id": 1,
                "embedding": [0.1, 0.2, 0.3, ...],
                "file_id": "file_id",
                "segment_id": 1
            },
            ...
        ]
        return the fetched content in json format
        """
        search_result = self.client.search(
            collection_name="task",
            data=[embedding],
            limit=3,
            search_params={"metric_type": "COSINE"},
            filter='user_id == {}'.format(user_id)
        )[0]
        results = []
        if len(search_result) > 0:
            for item in search_result:
                if item["distance"] > difference_threshold:
                    id = item["id"]
                    results.append(self.client.query(
                        collection_name="task",
                        filter='id == {}'.format(id)
                    )[0])
        return results
            
milvus_client = MyMilvusClient()