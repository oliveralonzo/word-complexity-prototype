from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Replacer


class SupplyLoremIpsum(APIView):
    replaceTool = Replacer()
    """
    need - error handling
    """
    def get(self, request):
        data = self.request.data
        if "type" not in request.data:
            # no type category
            return Response()
        try:
            if data["type"] == "word":
                word = self.replaceTool.replaceWord(data["text"])
                return Response(word)
            elif data["type"] == "sentence":
                sentence = self.replaceTool.replaceSentence(data["text"])
                return Response(sentence)
            elif data["type"] == "paragraph":
                paragraph = self.replaceTool.replaceParagraph(data["text"])
                return Response(paragraph)
        except KeyError as e:
            return Response("Invalid type provided").status_code(400)