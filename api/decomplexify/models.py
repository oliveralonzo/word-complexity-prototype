from django.db import models
import lorem
import random
import re


# Create your models here.

class Replacer(models.Model):

    def replaceWord(self, to_replace):
        text = lorem.sentence().split(" ")
        rand_index = random.randint(0, len(text))
        word = text[rand_index]
        word = re.sub(r'[^\w\s]', '', word)
        return word

    def replaceSentence(self, to_replace):
        sentence = lorem.sentence()
        return sentence

    def replaceParagraph(self, to_replace):
        paragraph = lorem.paragraph()
        return paragraph
