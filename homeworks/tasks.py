from schoolbag_queue.celery import app
from .models import HomeworkLog
from datetime import datetime


@app.task
def log(homework_id, status, date):
    homework = HomeworkLog.objects.get(pk=homework_id)

    if homework:
        print("Logging homework {} to {}".format(homework_id, status))
        date = datetime.strptime(date, "%Y-%m-%d %H:%M:%S")

        log = HomeworkLog(
            homework_id=homework_id,
            action=status,
            date=date)

        log.save()