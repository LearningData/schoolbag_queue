from django.views.generic import TemplateView
from schools.models import User

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
