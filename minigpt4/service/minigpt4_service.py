import io
from base64 import b64encode
from PIL import Image

import torch
from transformers import StoppingCriteria, StoppingCriteriaList
from minigpt4.database.models import Image as ImageModel
from minigpt4.database.repository import Repository

class StoppingCriteriaSub(StoppingCriteria):
    def __init__(self, stops=[]):
        super().__init__()
        self.stops = stops

    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor):
        for stop in self.stops:
            if torch.all((stop == input_ids[0][-len(stop) :])).item():
                return True

        return False


class MiniGPT4Service:
    def __init__(self, model, vis_processor, device="cuda:0"):
        self.device = device
        self.model = model
        self.image_embeddings = []
        self.vis_processor = vis_processor
        self.image_repository = Repository(ImageModel)
        stop_words_ids = [
            torch.tensor([835]).to(self.device),
            torch.tensor([2277, 29937]).to(self.device),
        ]
        self.stopping_criteria = StoppingCriteriaList(
            [StoppingCriteriaSub(stops=stop_words_ids)]
        )

    def get_output_text(self, outputs):
        output_token = outputs[0]
        if output_token[0] == 0:
            output_token = output_token[1:]
        if output_token[0] == 1:
            output_token = output_token[1:]
        output_text = self.model.llama_tokenizer.decode(
            output_token, add_special_tokens=False
        )
        output_text = output_text.split("###")[0]  # remove the stop sign '###'
        output_text = output_text.split("Assistant:")[-1].strip()
        return output_text

    def answer(
        self,
        message,
        image_embedding=None,
        max_new_tokens=300,
        max_length=2000,
    ):
        input_ids = self.get_embeddings(message, image_embedding)
        current_max_len = input_ids.shape[1] + max_new_tokens
        begin_idx = max(0, current_max_len - max_length)
        input_ids = input_ids[:, begin_idx:]
        outputs = self.model.llama_model.generate(
            inputs_embeds=input_ids,
            stopping_criteria=self.stopping_criteria,
            max_new_tokens=300,
            num_beams=1,
            do_sample=True,
            min_length=1,
            top_p=0.9,
            repetition_penalty=1.0,
            length_penalty=1,
            temperature=1.2,
        )
        return self.get_output_text(outputs)

    async def upload_images(self, images):
        for image in images:
            contents = await image.read()
            base64_representation = b64encode(contents).decode("utf-8")
            raw_image = Image.open(io.BytesIO(contents)).convert("RGB")
            image = self.vis_processor(raw_image).unsqueeze(0).to(self.device)
            self.image_repository.create(
                base64_representation=base64_representation,
            )
        return self.image_repository.list()
    
    def list_images(self):
        return self.image_repository.list()

    def get_prompt(self, message):
        return f"""'Given the following image: <Img>ImageContent</Img>. You will be able to see the image once I provide it to you. Please answer my question.###Human: <Img><ImageHere></Img> {message} ###Assistant:'"""

    def generate(self, message):
        responses = []
        for image_embedding in self.image_embeddings:
            responses.append(self.answer(message, image_embedding=image_embedding[0]))
        return responses
    
    def reset (self):
        self.image_embeddings = []

    def get_embeddings(self, message, image_embedding):
        prompt = self.get_prompt(message)
        prompt_segments = prompt.split("<ImageHere>")
        segment_tokens = [
            self.model.llama_tokenizer(
                segment, return_tensors="pt", add_special_tokens=i == 0
            )
            .to(self.device)
            .input_ids
            for i, segment in enumerate(prompt_segments)
        ]
        segment_embeddings = [
            self.model.llama_model.model.embed_tokens(seg_t) for seg_t in segment_tokens
        ]
        mixed_embeddings = [
            segment_embeddings[0],
            image_embedding,
            segment_embeddings[-1],
        ]
        return torch.cat(mixed_embeddings, dim=1)
