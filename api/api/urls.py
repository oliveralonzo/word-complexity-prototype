"""api URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.urlpatterns import format_suffix_patterns
from decomplexify.views import SupplySimplifications

urlpatterns = [

    # path(r'^decomplexify\/(\d+|)$', SupplyLoremIpsum.as_view())
    # path(r'^decomplexify\/([0-9]|^$)', SupplyLoremIpsum.as_view()),
    path('decomplexify/', SupplySimplifications.as_view()),
    path('decomplexify/<int:amount>/', SupplySimplifications.as_view()),
    #path('admin/', admin.site.urls),
]

urlpatterns = format_suffix_patterns(urlpatterns)
