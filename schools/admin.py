from django.contrib import admin
from .models import User, School

@admin.register(School)
class School(admin.ModelAdmin):
    exclude = ('avatar',)
    search_fields = ('name',)

@admin.register(User)
class User(admin.ModelAdmin):
    exclude = ('avatar',)
    search_fields = ('name', 'email',)
    list_filter=('school_id',)