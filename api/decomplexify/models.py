from django.db import models
from lorem_text import lorem
import random, re, json, os


# Create your models here.

class Replacer(models.Model):

    def __init__(self):
        script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
        rel_path = "sentences.json"
        abs_file_path = os.path.join(script_dir, rel_path)
        json_file = open(abs_file_path, "r")
        self.sentences = json.load(json_file)
        json_file.close()

    def replaceWord(self, to_replace):
        print("Word to be replaced -----> ", to_replace)
        text = lorem.sentence().split(" ")
        rand_index = random.randint(0, len(text) - 1)
        word = text[rand_index]
        word = re.sub(r'[^\w\s]', '', word)
        return word

    def replaceSentence(self, to_replace):
        print("Sentence to be replaced -----> ", to_replace)
        try:
            sentence = self.sentences[to_replace]
            print(sentence)
            return sentence
        except Exception as ex:
            print(ex)
            print("failed")
            return {}

    def replaceParagraph(self, to_replace):
        print("Paragraph to be replaced -----> ", to_replace)
        paragraph = lorem.paragraph()
        return paragraph

    def replaceParagraphs(self, to_replace, amount):
        print("Paragraphs to be replaced -----> ", to_replace)
        paragraphs = lorem.paragraphs(amount)
        return paragraphs
