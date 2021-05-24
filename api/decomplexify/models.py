from django.db import models
from lorem_text import lorem
import random
import re


# Create your models here.

class Replacer(models.Model):

    def replaceWord(self, to_replace):
        print("Word to be replaced -----> ", to_replace)
        text = lorem.sentence().split(" ")
        rand_index = random.randint(0, len(text) - 1)
        word = text[rand_index]
        word = re.sub(r'[^\w\s]', '', word)
        return word

    def replaceSentence(self, to_replace):
        print("Sentence to be replaced -----> ", to_replace)
        sentence = lorem.sentence()
        return sentence

    def replaceParagraph(self, to_replace):
        print("Paragraph to be replaced -----> ", to_replace)
        paragraph = lorem.paragraph()
        return paragraph

    def replaceParagraphs(self, to_replace, amount):
        print("Paragraphs to be replaced -----> ", to_replace)
        paragraphs = lorem.paragraphs(amount)
        return paragraphs
