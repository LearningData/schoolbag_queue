from django.contrib import admin
from .models import ClassList

class ReadonlyTabularInline(admin.TabularInline):
    can_delete = False
    extra = 0
    editable_fields = []

    def get_readonly_fields(self, request, obj=None):
        fields = []
        for field in self.model._meta.get_all_field_names():
            if (not field == 'id'):
                if (field not in self.editable_fields):
                    fields.append(field)
        return fields

    def has_add_permission(self, request):
        return False

class StudentsInline(ReadonlyTabularInline):
    model = ClassList.students.through

@admin.register(ClassList)
class ClassList(admin.ModelAdmin):
    search_fields = ('subject__name', 'extra_ref',)
    list_filter=('school_id',)
    inlines = (StudentsInline,)


