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


text = "Read and describe image briefly."
images = []
answer = []

for i in range(1, pdf_pages_number+1):
    img = Image.open("image-pdf/" + val + "0001-" + str(i) + ".jpg")
    response = gemini_pro_vision.generate_content( [text, img] )
    answer += [response.text]


# Output summary of the pdf file, three keywords and one question for review
prompt = "Read and describe answer briefly. And, based on the three key words you have chosen, create one question for and answer. "
response = gemini_pro.generate_content( [prompt, *answer])
print(response.text)
