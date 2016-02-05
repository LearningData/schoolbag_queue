from django.conf.urls import url
from .views import IndexView, classes, notices, calendar

urlpatterns = [
    url(r'^dashboard$', IndexView.as_view(), name='dashboard-index'),
    url(r'^service/classes/$', classes, name='dashboard-classes'),
    url(r'^service/notices/$', notices, name='dashboard-notices'),
    url(r'^service/calendar/$', calendar, name='dashboard-calendar')
]
