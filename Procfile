web: gunicorn schoolbag_queue.wsgi --log-file -
worker: celery worker --app=schoolbag_queue.celery.app
