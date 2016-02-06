from django.conf.urls import url
from .views import LoginView

urlpatterns = [
    url(r'^$', LoginView.as_view(), name='accounts-login'),
]
