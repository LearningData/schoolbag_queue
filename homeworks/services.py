from django.conf import settings
from datetime import date, timedelta


class HomeworkUtil:
    @staticmethod
    def to_dashboard(user, limit=10):
        today = date.today()
        limit_date = today - timedelta(days=settings.HOMEWORK_EXPIRY_DATE)

        if user.is_student():
            homeworks = user.homeworkuser_set.filter(
                info__set_date__lte=today,
                info__due_date__gt=limit_date,
                status__lte=2).order_by("info__due_date", "status")[:limit]
        else:
            homeworks = user.homework_set.filter(
                due_date=today).order_by("due_date")[:limit]

        homeworks = [homework.to_dict() for homework in homeworks]

        return homeworks
