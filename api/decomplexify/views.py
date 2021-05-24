from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Replacer
import json


class SupplyLoremIpsum(APIView):
    replaceTool = Replacer()
    """Returns the simplified text for given complex text. needs error handling

    Keyword arguments:
    request -- Request object
    amount -- Specifies the number of simpliefied paragraphs to be replaced
            Applicable only to documents.
    """ 

    def post(self, request, amount = None):
        data = self.request.data
        print("Request = ", request)
        if "type" not in data:
            # no type category
            return Response("No type provided", status=status.HTTP_404_NOT_FOUND)
        try:
            if data["type"] == "word":
                print(data["type"], data["text"])
                word = self.replaceTool.replaceWord(data["text"])
                return Response(word)
            elif data["type"] == "sentence":
                sentence = self.replaceTool.replaceSentence(data["text"])
                return Response(sentence)
            elif data["type"] == "paragraph":
                paragraph = self.replaceTool.replaceParagraph(data["text"])
                print(data["type"], data["text"])
                return Response(paragraph)
            elif data["type"] == 'document':
                print("Successfully routed to document")
                print("Amount = ", amount)
                paragraphs = self.replaceTool.replaceParagraphs(data["text"], amount)
                return Response(paragraphs)
        except KeyError as e:
            return Response("Invalid type provided", status=status.HTTP_404_NOT_FOUND)