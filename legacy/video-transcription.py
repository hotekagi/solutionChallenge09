# 使用方法
# 38行目のwebm_fileに変換したいファイル名を指定して呼び出し

# webmをmp3に変換して、whisperで文字起こし

import argparse
import subprocess
from pathlib import Path

import google.generativeai as genai
import whisper
import yaml

parser = argparse.ArgumentParser(description="Convert webm to mp3, transcribe and summarize its contents.")
parser.add_argument("--input", "-i", type=str, help="Input webm file name", required=True)
args = parser.parse_args()


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


input_file = Path(__file__).parent.joinpath("video-uploads", args.input)
input_converted_file = input_file.with_suffix(".mp3")
output_file = input_file.with_suffix(".txt")
convert_webm_to_mp3(input_file, input_converted_file)


# Whisper Model Selection
model = whisper.load_model("small")
result = model.transcribe(str(input_converted_file))

output_txt = result["text"]
print(output_txt)
with open(output_file, "w") as f:
    f.write(f"音声認識結果\n{output_txt}\n\n")

output_txt = result["text"]
text = " You are a corrector. Please read a sentence and correct its typographical errors. Try to maintain the form of the original sentence as much as possible. Also, summarize the sentence into three sentences. The summary should be prepared in English and then translated into the language used for the text before output. The output is the translated summary only. "

response = gemini_pro.generate_content([text, output_txt])

print(response.text)
with open(output_file, "a") as f:
    f.write(f"要約結果\n{response.text}")
