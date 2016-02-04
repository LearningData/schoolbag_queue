from django.contrib import admin
from .models import Homework


@admin.register(Homework)
class Homework(admin.ModelAdmin):
    pass
