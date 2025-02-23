/**
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader
import replicate
from dotenv import dotenv_values
import io
from difflib import SequenceMatcher

import json
# import datetime
import os
import sys
import argparse
from bs4 import BeautifulSoup
from huggingface_hub import InferenceClient
from openai import OpenAI
from newspaper import Article
from ollama import Client as OllamaClient, ChatResponse as OllamaChatResponse

parser = argparse.ArgumentParser()
parser.add_argument('-s', '--statements', required=True, action="append")
parser.add_argument('-t', '--temperature', required=False)
parser.add_argument('-u', '--url', required=True)
parser.add_argument('-m', '--model', required=True)
parser.add_argument('-p', '--provider', required=True, choices=['replicate', 'tgi', 'webui', 'ollama'])
parser.add_argument('-o', '--openai_api_url', required=False)
args = parser.parse_args()

# os.environ["REPLICATE_API_TOKEN"] = dotenv_values()["REPLICATE_API_TOKEN"]
sys.stdout.reconfigure(encoding="utf-8")

INPUT_URL = str(args.url)
MODEL_PROVIDER = str(args.provider)
MODEL = str(args.model)
# TEMPERATURE = float(args.temperature)

INPUT_STATEMENTS = []
for statement in args.statements:
    triple = statement.split(",")
    INPUT_STATEMENTS.append({
        "subject": triple[0],
        "predicate": triple[1],
        "object": triple[2]
    })

if args.provider == "tgi": inf_client = InferenceClient(model=args.openai_api_url)
elif args.provider == "webui": inf_client = OpenAI(base_url=args.openai_api_url, api_key="-")
elif args.provider == "ollama": inf_client = OllamaClient(host=args.openai_api_url)

SYSTEM_PROMPT = ("You are an accurate reasoning assistant. You will be given a statement to evaluate its truthfulness based on an input context. " + 
                "You will respond only with a parsable JSON object containing only the following fields: isValid (boolean), reason (string).")
CONTEXT_SIZE = requests.get("https://llm.vse.cz/tgi/info",
            headers={"Content-Type":"application/json"},
        ).json()["max_total_tokens"] if MODEL_PROVIDER == "tgi" else 16384

def get_model_info():
    if MODEL_PROVIDER == "tgi":
        return requests.get("https://llm.vse.cz/tgi/info",
            headers={"Content-Type":"application/json"},
        ).json()
    if MODEL_PROVIDER == "webui":
        return requests.get("https://llm.vse.cz/text-generation-webui/api/v1/internal/model/info",
            headers={"Content-Type":"application/json"},
        ).json()

def get_token_count(text):
    if MODEL_PROVIDER == "tgi":
        return len(
            requests.post("https://llm.vse.cz/tgi/tokenize",
                headers={"Content-Type":"application/json"},
                json={"inputs":text}
            ).json()
        )
    if MODEL_PROVIDER == "webui":    
        return requests.post(
            "https://llm.vse.cz/text-generation-webui/api/v1/internal/token-count",
            headers={"Content-Type":"application/json"},
            json={"text":text}
        ).json()["length"]


#simplified function for validating ALL text of a webpage
def get_text_from_url(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
    except Exception as e:
        print("Error:" + str(e))
        return ""
    print(article.text)
    return article.text

def get_paragraphs_from_url(url):
    try:
        r = requests.get(url, timeout=10)
    except Exception as e:
        print("Error: {}".format(str(e)))
        return []
    content_type = r.headers.get('content-type')
    if content_type == "application/pdf":
        f = io.BytesIO(r.content)
        reader = PdfReader(f)
        paragraphs = []
        for page in reader.pages:
            # špatné řešení, ale prozatím to šetří mnoho API requestů
            if "References" in page.extract_text():
                break
            content = page.extract_text().split('\n')
            final = []
            for cont in content:
                if len(cont) >= 50:
                    final.append(cont)
            paragraphs.append(" ".join(final))
        return paragraphs
    soup = BeautifulSoup(r.text, 'html.parser')
    listOfParagraphs = []
    for data in soup.find_all("p"):
        if data.getText():
            trimmed = ' '.join(data.getText().replace("\n", "").split())
            if len(trimmed) >= 30:
                listOfParagraphs.append(trimmed)
    return listOfParagraphs


def infer(message, max_new_tokens, json_output=False):
    #DŮLEŽITÉ NASTAVIT LLAMA PRECISE V WEBUI
    def infer_webui():
        completion = inf_client.chat.completions.create(
            model=get_model_info(),
            max_tokens=max_new_tokens,
            n=1,
            # temperature=TEMPERATURE or 0.5,
            stream=True,
            response_format={ "type": "json_object"} if json_output else "text",
            messages=[
                {'role': "system", "content": SYSTEM_PROMPT},
                {'role': 'user', 'content': message}]
        )
        response = ""
        for chunk in completion:
            response += str(chunk.choices[0].delta.content)
            # if chunk.usage: print("received" + str(chunk.usage))
            # tokens += chunk.usage
        return response
        # return completion.choices[0].message.content
    def infer_tgi():
        response = ''
        for token in inf_client.text_generation(message, stream=True,
            max_new_tokens=max_new_tokens,
            # temperature=TEMPERATURE or 0.5,
            top_p=0.9):
            response = response + str(token)
        return response
    def infer_replicate():
        response = ''
        options = ({**COMMON_PROMPT_SETTINGS,
                    # "temperature": TEMPERATURE or 0.5,
                    "max_new_tokens": max_new_tokens,
                    'system_prompt': 'You are a helpful assistant.',
                    'prompt': message, 'stream': True}
        )
        for event in replicate.stream(MODEL, options):
            response = response + str(event)
        return response
    return (
        infer_replicate() if MODEL_PROVIDER == 'replicate' else
        infer_tgi() if MODEL_PROVIDER == 'tgi' else
        infer_webui() if MODEL_PROVIDER == 'webui' else
        Exception("Invalid model provider")
    )


## tuto funkci volám, když je vrácený počet odstavců z funkce """get_paragraphs_from_url""" příliš mnoho
## parametr n vrátí n nejbližších odstavců řetězci spojeného ze subjektu a obejktu
def get_similar_paragraphs(subject, object, text_chunks, n):
    paragraphs_similarized = []
    ratios = []
    for p in text_chunks:
        s = SequenceMatcher(None, f"{subject} {object}", p)
        ratios.append([s.ratio(), p])
    ratios.sort(reverse=True)
    for r in ratios[:n]:
        # print(f"{r[0]} {r[1]}")
        paragraphs_similarized.append(r[1])
    return paragraphs_similarized


def validate(text, statement):
    schema = {
        "title": "Evaluation",
        "type": "object",
        "properties": {
            "verdict": {
                "title": "VerdictEnum",
                "type": "string",
                "enum": [
                    "True",
                    "False",
                    "Indeterminate"
                ]
            },
            "explanation": {
                "title": "Explanation",
                "type": "string"
            }
        },
        "required": [
            "verdict",
            "explanation"
        ]
    }
    prompt = ("You are an expert fact-checker with the ability to evaluate the truthfulness of statements based on" +
    f"""provided context. I will give you input in the following format:
{{
    "context": "[a detailed and accurate description of the facts, background information, or evidence]",
    "statement": "[a claim or assertion to evaluate]"
}}

Your task is to analyze the statement based on the context and provide:
1) A clear verdict whether the statement is True, False, or Indeterminate (if the context is insufficient to decide),
2) a concise explanation of your reasoning.
Please use the following schema: {json.dumps(schema)}

Example input and expected output:
Given input:
{{
    "context": "The Eiffel Tower is located in Paris, France, and stands approximately 330 meters tall.",
    "statement": "The Eiffel Tower is 400 meters tall."
}}
Expected output: {{
    "verdict": "False",
    "explanation": "The context clearly states that the Eiffel Tower is approximately 330 meters tall, not 400 meters."
}}
End of example.

Now, evaluate the following:
{{
    "context": "{text}",
    "statement": "{str(statement['subject']).capitalize()} {statement['predicate']} {statement['object']}."
}}""")
    
    response: OllamaChatResponse = inf_client.chat(model=args.model,
                                                   stream=False, format=schema,
                                                   messages=[{ "role": "user", "content": prompt }],
                                                   options={
                                                       "temperature": 0,
                                                        "top_p": 1,
                                                        "repeat_penalty": 1.1
                                                        }
                                                    )
    return response["message"]["content"]

    # return inf_client.text_generation(prompt,
    #     max_new_tokens=512,
    #     temperature=0.2,
    #     top_p=0.7, grammar={
    #         "type": "json",
    #         "value": schema
    #     })


def main():
    statement = INPUT_STATEMENTS[0]
    text = "\n".join(get_paragraphs_from_url(INPUT_URL))
    response = validate(text, statement)
    
    try:
        parsed_json = json.loads(response, strict=False)
    except Exception as e:
        print("model returned malformed json:", e, flush=True)
        print("ipc:error" + e, flush=True)
        exit()
    
    verdict = parsed_json["verdict"]
    parsed_json["verdict"] = True if verdict == "True" else False if verdict == "False" else None
    ipc_json = json.dumps(parsed_json)
    
    print("ipc:" + ipc_json, flush=True)

main()
*/