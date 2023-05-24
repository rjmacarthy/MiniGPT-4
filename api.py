from fastapi import FastAPI, UploadFile
from typing import List
import argparse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

import uvicorn

from fastapi import FastAPI
from pydantic import BaseModel as PydanticBaseModel

from minigpt4.common.config import Config
from minigpt4.common.registry import registry
from minigpt4.service.minigpt4_service import MiniGPT4Service


def parse_args():
    parser = argparse.ArgumentParser(description="MiniGPT4 Api")
    parser.add_argument(
        "--cfg-path",
        help="path to configuration file.",
        default="eval_configs/minigpt4_eval.yaml",
    )
    parser.add_argument("--gpu-id", type=int, default=0)
    parser.add_argument(
        "--options",
        nargs="+",
        help="override some settings in the used config, the key-value pair "
        "in xxx=yyy format will be merged into config file (deprecate), "
        "change to --cfg-options instead.",
    )
    args = parser.parse_args()
    return args


def get_minigpt4_service():
    args = parse_args()
    cfg = Config(args)
    model_config = cfg.model_cfg
    model_config.device_8bit = args.gpu_id
    model_cls = registry.get_model_class(model_config.arch)
    model = model_cls.from_config(model_config).to("cuda:{}".format(args.gpu_id))
    vis_processor_cfg = cfg.datasets_cfg.cc_sbu_align.vis_processor.train
    vis_processor = registry.get_processor_class(vis_processor_cfg.name).from_config(
        vis_processor_cfg
    )
    minigpt4_service = MiniGPT4Service(
        model, vis_processor, device="cuda:{}".format(args.gpu_id)
    )
    return minigpt4_service


class GenerateRequest(PydanticBaseModel):
    prompt: str
    image_ids: List[int]
    
class DeleteImageRequest(PydanticBaseModel):
    image_ids: List[int]


if __name__ == "__main__":
    app = FastAPI()
    app.cors = True
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    minigpt4_service = get_minigpt4_service()

    @app.post("/upload")
    async def upload(images: List[UploadFile]):
        images = await minigpt4_service.upload_images(images)
        return JSONResponse(content=jsonable_encoder(images))

    @app.post("/reset")
    async def reset():
        return minigpt4_service.reset()

    @app.post("/delete_images")
    async def delete_images(request: DeleteImageRequest):
        images = await minigpt4_service.delete_images(request.image_ids)
        return JSONResponse(content=jsonable_encoder(images))

    @app.get("/list_images")
    async def list_images():
        images = await minigpt4_service.list_images()
        return JSONResponse(content=jsonable_encoder(images))

    @app.post("/generate")
    async def generate(request: GenerateRequest):
        return minigpt4_service.generate(request.prompt, request.image_ids)

    uvicorn.run(app, host="0.0.0.0", port=8000)
