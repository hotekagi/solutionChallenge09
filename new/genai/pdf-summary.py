import argparse
from pathlib import Path

import google.generativeai as genai
import yaml
from pdf2image import convert_from_path
from PIL import Image
from PyPDF2 import PdfReader


parser = argparse.ArgumentParser(description="Read the pdf file and summarize its contents.")
parser.add_argument("--input", "-i", type=str, help="Input PDF file name", required=True)
args = parser.parse_args()


# Set the Gemini API key
with open(Path(__file__).parent / "config.yaml", "r") as f:
    config = yaml.safe_load(f)

GOOGLE_API_KEY = config["GOOGLE_API_KEY"]
genai.configure(api_key=GOOGLE_API_KEY)


# Convert all pages of a pdf file to jpeg
pdf_path = Path(__file__).parent.joinpath("pdf-uploads", args.input)
img_folder = Path(__file__).parent / "pdf-images"
convert_from_path(pdf_path, output_folder=img_folder, fmt="jpeg", output_file=pdf_path.stem)


# Get the number of pages in the pdf file
reader = PdfReader(pdf_path)
pdf_pages_number = len(reader.pages)


# Set the Gemini API model
gemini_pro = genai.GenerativeModel("gemini-pro")
gemini_pro_vision = genai.GenerativeModel("gemini-pro-vision")


text = (
    "You are a teacher. You read the class material and summarize it. "
    "Please summarize based on what is written in the material and try to add as little of your own pertinent information as possible. "
    "Try to choose five key words. Your output will consist of a summary and five key words."
)
images = []
for i in range(1, pdf_pages_number + 1):
    img = Image.open(img_folder.joinpath(f"{pdf_path.stem}0001-{i:0{len(str(pdf_pages_number))}}.jpg"))
    images.append(img)

response_img = gemini_pro_vision.generate_content([text, *images])
print(response_img.text)

# Output summary of the pdf file, three keywords and one question for review
prompt = (
    "You are a teacher. You have just summarized the class material. "
    "Read the entire summary and create five questions for your students to review based on each of the five key words you specified. "
    "Create answers to these review questions as well. "
    "These questions should be based on the summary of each reading and should add as little information as possible outside of the material. "
    "The output will consist of review questions and answers."
)
response_summary = gemini_pro.generate_content([prompt, response_img.text])
print(response_summary.text)

with open(pdf_path.parent.joinpath(f"{pdf_path.stem}.summary.txt"), "w") as f:
    f.write(response_summary.text)
