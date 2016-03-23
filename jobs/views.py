from django.views.decorators.csrf import csrf_exempt
from django.views.generic import View
from django.http import JsonResponse

from homeworks.tasks import log

class LogHomework(View):
    def post(self, request):
        post = request.POST

        if 'key' in post:
            log.apply_async(
                args=(post.get("homework_id"), post.get("status"), post.get("date")),
                countdown=2)
            return JsonResponse({"status": "success"})

        response =  JsonResponse({"status": "error", "message": "Unauthorized"})
        response.status_code = 401

        return response

    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super(LogHomework, self).dispatch(*args, **kwargs)