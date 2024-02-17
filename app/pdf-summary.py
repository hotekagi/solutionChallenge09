# Read the pdf file and summarize its contents

import google.generativeai as genai
from PIL import Image
from pathlib import Path
from pdf2image import convert_from_path
from PyPDF2 import PdfReader
import yaml

def load_config(config_file):
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)
    return config

# Set the Gemini API key
config = load_config('config.yaml')
GOOGLE_API_KEY = config['GOOGLE_API_KEY']
genai.configure(api_key=GOOGLE_API_KEY)


# Enter the name of the pdf file
val = input('Enter pdf name (no need ".pdf" ): ')


# Convert all pages of a pdf file to jpeg
pdf_path = Path("./data/" + val + ".pdf")
img_path=Path("./image-pdf")
convert_from_path(pdf_path, output_folder=img_path,fmt='jpeg',output_file=pdf_path.stem)


# Get the number of pages in the pdf file
reader = PdfReader(pdf_path)
pdf_pages_number = len(reader.pages)


# Set the Gemini API model
gemini_pro = genai.GenerativeModel("gemini-pro")
gemini_pro_vision = genai.GenerativeModel("gemini-pro-vision")


text = "You are a teacher. You have read the class material and are attempting to summarize it. With this in mind, summarize the images presented in three sentences or less. Please base your summary on what is in the material and avoid adding your own relevance information if at all possible."
images = []
answer = []

for i in range(1, pdf_pages_number+1):
    if(pdf_pages_number+1 > 99):
        if(i < 10):
            img = Image.open("image-pdf/" + val + "0001-00" + str(i) + ".jpg")
        elif(i < 100):
            img = Image.open("image-pdf/" + val + "0001-0" + str(i) + ".jpg")
        else:
            img = Image.open("image-pdf/" + val + "0001-" + str(i) + ".jpg")
    elif(pdf_pages_number+1 > 9):
        if(i < 10):
            img = Image.open("image-pdf/" + val + "0001-0" + str(i) + ".jpg")
        else:
            img = Image.open("image-pdf/" + val + "0001-" + str(i) + ".jpg")
    else:
        img = Image.open("image-pdf/" + val + "0001-" + str(i) + ".jpg")

    response = gemini_pro_vision.generate_content( [text, img] )
    answer += [response.text]


# Output summary of the pdf file, three keywords and one question for review
prompt = "You are a teacher. You have just read the class material page by page and summarized each page. Now read all the summaries you have just read and select five key words. Choose only the words that were included in any of the summaries as keywords. Next, create five questions for students to review based on each of the key words. Create answers to these review questions as well. These questions should be based on the summary of each reading and should add as little information outside of the material as possible. Your output will consist of an overall summary, five key words, review questions, and answers."
response = gemini_pro.generate_content( [prompt, *answer])
print(response.text)
