from rest_framework import serializers
from decomplexify.models import Replacer

class ReplacerSerializer(serializers.Serializer):

    def create(self, ):
        """
        Create and return a new `Snippet` instance, given the validated data.
        """
        return Replacer.objects.create()