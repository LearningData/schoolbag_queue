from django.http import JsonResponse
from django.views.generic import TemplateView
from django.core.serializers.json import DjangoJSONEncoder
from schools.models import User, Noticeboard
from lessons.models import ClassList
from homeworks.services import HomeworkUtil

import json

class IndexView(TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        if 'view' not in kwargs:
            kwargs['view'] = self

        user = User.objects.get(pk=4587)


        configs = {
            'module': {
                'timetable': True,
                'homework': True,
                'calendar': True,
                'messages': False,
                'notices': True
            }
        }

        kwargs['user'] = user
        kwargs['configs'] = configs

        return kwargs


def classes(request):
    # PAUL: 4598
    # WALSH: 4587
    user = User.objects.get(pk=4598)

    json = []
    for class_list in user.get_classes():
        json.append({"id": class_list.pk, "subject": class_list.subject.name})

    return JsonResponse({"classes": json})

def notices(request):
    user = User.objects.get(pk=4587)
    notices = Noticeboard.all_notices(user)

    notices_arr = [notice.to_dict() for notice in notices]

    for notice in user.noticeboard_set.all():
        notices_arr.append(notice.to_dict())

    return JsonResponse(
        {"status": "success", "notices": notices_arr})

def calendar(request):
    user = User.objects.get(pk=4587)
    return JsonResponse(
        [event.to_dict() for event in user.event_set.all()], safe=False)

def homeworks(request):
    user = User.objects.get(pk=4587)

    return JsonResponse(
        {"status": "success", "homeworks": HomeworkUtil.to_dashboard(user)})
