from django.conf.urls import url
from .views import IndexView

urlpatterns = [
    url(r'^$', IndexView.as_view(), name='dashboard-index'),
    url(r'^dashboard$', IndexView.as_view(), name='dashboard-index2')
]
