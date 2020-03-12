import os
import json
from base64 import b64encode, b64decode
from matplotlib import pyplot as plt

import mxnet as mx
import sagemaker
from gluoncv.utils import download, viz


def serializer(data):
    return json.dumps(data).encode('utf-8')


def deserializer(body, content_type):
    return json.loads(body.read().decode('utf-8'))


if __name__ == '__main__'
    endpoint = 'yolo3-0Endpoint'

    bimage = None
    download(
        'https://sportshub.cbsistatic.com/i/r/2019/11/15/10869f78-1378-4aa5-b36b-085607ae3387/thumbnail/770x433/f3276ac966a56b7cb45987869098cddb/lionel-messi-argentina-brazil.jpg',
        path='messi.jpg'
    )
    with open('messi.jpg', 'rb') as fp:
        bimage = fp.read()
    s = b64encode(bimage).decode('utf-8')

    predictor = sagemaker.predictor.RealTimePredictor(
        endpoint=endpoint,
        content_type='application/json',
        accept='application/json',
        serializer=serializer,
        deserializer=deserializer,
    )

    res = predictor.predict({
        'short': 320,
        'image': s
    })
    print(res['shape'])
