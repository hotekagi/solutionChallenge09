# 使用方法
# 38行目のwebm_fileに変換したいファイル名を指定して呼び出し

# webmをmp3に変換して、whisperで文字起こし


import subprocess
import ffmpeg 
import whisper
import os

import google.generativeai as genai
import yaml
from PIL import Image

def load_config(config_file):
    with open(config_file, "r") as f:
        config = yaml.safe_load(f)
    return config

def convert_webm_to_mp3(webm_file, mp3_file):
    try:
        subprocess.run(["ffmpeg", "-i", webm_file, "-vn", "-acodec", "libmp3lame", mp3_file])
        print("Conversion successful!")
    except Exception as e:
        print("An error occurred:", e)

# Set the Gemini API key
config = load_config("config.yaml")
GOOGLE_API_KEY = config["GOOGLE_API_KEY"]
genai.configure(api_key=GOOGLE_API_KEY)

# Set the Gemini API model
gemini_pro = genai.GenerativeModel("gemini-pro")


# 変換するファイル名を指定して呼び出し
webm_file = "test3" # + ".webm"


# Convert webm to wav
input_file =  "video-uploads/" + webm_file + ".webm"
input_change_file = "video-change-webm-mp3/" + webm_file + ".mp3"
output_file = "video-transcription-txt/" + webm_file + ".txt"
convert_webm_to_mp3(input_file, input_change_file)


# Whisper Model Selection
model = whisper.load_model("small")
result = model.transcribe(input_change_file)

output_txt = result["text"]

with open(output_file, "w") as f:
    f.write(output_txt)

output_txt = result["text"]
text = " You are a corrector. Please read a sentence and correct its typographical errors. Try to maintain the form of the original sentence as much as possible. Also, summarize the sentence into three sentences. The summary should be prepared in English and then translated into the language used for the text before output. The output is the translated summary only. "

response = gemini_pro.generate_content([text, output_txt])

print(response.text)