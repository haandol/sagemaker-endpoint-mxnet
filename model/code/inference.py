'''Deploy Stage'''

# Built-Ins:
import os
import sys
import json
import subprocess
from base64 import b64decode

# Install/Update GluonCV:
subprocess.call([sys.executable, '-m', 'pip', 'install', 'gluoncv'])

import mxnet as mx
import gluoncv as gcv

ctx = mx.gpu()


def model_fn(model_dir):
    classes = ['person']
    net = gcv.model_zoo.get_model(
        'yolo3_darknet53_coco',
        pretrained=True,
        ctx=ctx,
    )
    net.reset_class(classes=classes, reuse_weights=classes)
    net.hybridize(static_alloc=True, static_shape=True)
    return net


def input_fn(request_body, content_type):
    if content_type == 'application/json':
        D = json.loads(request_body)

        short = D.get('short', 416)
        image = b64decode(D['image'])
        x, _ = gcv.data.transforms.presets.yolo.transform_test(
            mx.image.imdecode(image), short=short
        )
        return x.as_in_context(ctx)
    else:
        raise RuntimeError(f'Not support content-type: {content_type}')


def predict_fn(input_object, model):
    x = input_object
    cid, score, bbox = model(x)
    return x.shape, cid, score, bbox


def output_fn(prediction, content_type):
    shape, cid, score, bbox = prediction
    if content_type == 'application/json':
        return json.dumps({
            'shape': shape,
            'cid': cid[0].asnumpy().tolist(),
            'score': score[0].asnumpy().tolist(),
            'bbox': bbox[0].asnumpy().tolist()
        })
    else:
        raise RuntimeError(f'Not support content-type: {content_type}')
