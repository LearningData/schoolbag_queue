from django.http import JsonResponse
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from schools.models import User, Noticeboard
from homeworks.services import HomeworkUtil


class IndexView(TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        if 'view' not in kwargs:
            kwargs['view'] = self

        configs = {
            'module': {
                'timetable': True,
                'homework': True,
                'calendar': True,
                'messages': False,
                'notices': True
            }
        }

        kwargs['configs'] = configs

        return kwargs


def classes(request):
    json = []
    for class_list in request.user.get_classes():
        json.append({"id": class_list.pk, "subject": class_list.subject.name})

    return JsonResponse({"classes": json})


def notices(request):
    notices = Noticeboard.all_notices(request.user)

    notices_arr = [notice.to_dict() for notice in notices]

    for notice in user.noticeboard_set.all():
        notices_arr.append(notice.to_dict())

    return JsonResponse(
        {"status": "success", "notices": notices_arr})


def calendar(request):
    return JsonResponse(
        [event.to_dict() for event in request.user.event_set.all()], safe=False)


def homeworks(request):
    return JsonResponse(
        {"status": "success", "homeworks": HomeworkUtil.to_dashboard(request.user)})
