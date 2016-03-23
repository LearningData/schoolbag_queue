from django.conf.urls import url
from .views import LogHomework

urlpatterns = [
    url(r'^jobs/homeworks/log$', LogHomework.as_view(), name='log-homework'),
]