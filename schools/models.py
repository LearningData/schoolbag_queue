from django.db import models
from django.conf import settings
from django.db.models import Q

from PIL import Image
from datetime import date
import os


class Avatar(models.Model):
    name = models.CharField(max_length=100)
    size = models.IntegerField(blank=True, null=True)
    type = models.CharField(max_length=40, blank=True, null=True)
    file = models.TextField(db_column='file')

    def to_file(self, name):
        path = "{}{}{}".format(
            settings.MEDIA_ROOT, "img/original/", name)

        file = open(path,'wb')
        file.write(self.file)
        file.close()

    def to_thumbnail(self, name):
        size = (67, 62)
        original_path = "{}{}{}".format(
            settings.MEDIA_ROOT, "img/original/", name)

        thumb_path = "{}{}{}".format(
            settings.MEDIA_ROOT, "img/thumb/", name)

        image = Image.open(original_path)
        image.thumbnail(size)
        image.save(thumb_path, "JPEG")

    class Meta:
        managed = False
        db_table = 'avatar'


class Cohort(models.Model):
    year = models.IntegerField(db_column='schoolYear')
    stage = models.CharField(max_length=4)

    school = models.ForeignKey(
        'School',
        db_column="schoolId",
        on_delete=models.CASCADE,
    )

    course = models.ForeignKey(
        'Course',
        db_column="courseId",
        on_delete=models.CASCADE,
    )

    group = models.ForeignKey(
        'Group',
        db_column="groupId",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return "{} / {}".format(self.stage, self.year)

    class Meta:
        managed = False
        db_table = 'cohorts'


class Config(models.Model):
    name = models.CharField(max_length=100)
    value = models.CharField(max_length=100)
    school = models.ForeignKey(
        'School',
        db_column="schoolId",
        on_delete=models.CASCADE,
    )

    @staticmethod
    def get_year(school_id):
        config = Config.objects.filter(
            name="schoolYear", school_id=school_id).order_by("-value").first()

        if config:
            return int(config.value)

        if date.today().month >= Config.cut_off_month(school_id):
            return date.today().year + 1

        return date.today().year

    @staticmethod
    def cut_off_month(school_id):
        config = Config.objects.filter(
            name="cutOffMonth", school_id=school_id).first()

        if config:
            return int(config.value)

        return settings.YEAR_CUT_OFF_MONTH

    class Meta:
        managed = False
        db_table = 'config'


class Course(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'course'


class Event(models.Model):
    title = models.CharField(max_length=100)
    start_date = models.DateTimeField(db_column='startDate')
    end_date = models.DateTimeField(db_column='endDate')
    location = models.CharField(max_length=200, blank=True, null=True)
    contact = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    all_day = models.IntegerField(
        db_column='allDay', blank=True, null=True, default=False)
    created_at = models.DateTimeField(db_column='createdAt')
    link = models.CharField(max_length=200, blank=True, null=True)

    user = models.ForeignKey(
        'User',
        db_column="userId",
        on_delete=models.CASCADE,
    )

    def to_dict(self):
        return {
            "title": self.title,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "location": self.location,
            "contact": self.contact,
            "description": self.description,
            "all_day": self.all_day,
            "created_at": self.created_at,
            "link": self.link,
        }

    class Meta:
        managed = False
        db_table = 'events'


class FailedLogin(models.Model):
    ip_address = models.CharField(
        db_column='ipAddress', max_length=15, blank=True, null=True)
    user_agent = models.CharField(
        db_column='userAgent', max_length=300, blank=True, null=True)
    date = models.DateTimeField(blank=True, null=True)

    user = models.ForeignKey(
        'User',
        db_column="userId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'failed_login'


class GroupMembers(models.Model):
    user = models.ForeignKey(
        'User',
        db_column="userId",
        on_delete=models.CASCADE,
    )

    group = models.ForeignKey(
        'Group',
        db_column="groupId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'group_members'


class Group(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    type = models.IntegerField(blank=True, null=True)
    access_code = models.CharField(
        db_column='accessCode', max_length=8, blank=True, null=True)

    school = models.ForeignKey(
        'School',
        db_column="schoolId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'groups'


class Noticeboard(models.Model):
    date = models.DateTimeField()
    text = models.TextField()
    user_type = models.CharField(db_column='userType', max_length=1)
    file_attached = models.CharField(
        db_column='fileAttached', max_length=100, blank=True, null=True)
    title = models.CharField(max_length=100, blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    expiry_date = models.DateTimeField(
        db_column='expiryDate', blank=True, null=True)

    school = models.ForeignKey(
        'School',
        db_column="schoolID",
        on_delete=models.CASCADE,
    )

    user = models.ForeignKey(
        'User',
        db_column="uploadedBy",
        on_delete=models.CASCADE,
    )

    class_list = models.ForeignKey(
        "lessons.ClassList",
        db_column="classID",
        on_delete=models.CASCADE,
    )

    @staticmethod
    def all_notices(user):
        today = date.today()
        classes_ids = user.get_classes().values_list('pk', flat=True)

        if user.is_teacher():
            classes_query = Q(class_list_id__in=classes_ids)
        else:
            classes_query = Q(
                user_type__in=['A', 'P'],
                class_list_id__in=classes_ids)

        school_query = Q(school_id=user.school_id, user_type='A')
        schoolbag_query = Q(user_id=user.pk, school_id=0)

        notices = Noticeboard.objects.filter(
            classes_query | school_query | schoolbag_query,
            date__lte=today,
            expiry_date__gte=today).order_by('-date')

        return notices

    def to_dict(self):
        return {
            "id": self.pk,
            "text": self.text,
            "date": self.date,
            "title": self.title,
            "category": self.category,
        }

    class Meta:
        managed = False
        db_table = 'noticeboard'


class NoticeboardFiles(models.Model):
    name = models.CharField(max_length=100)
    original_name = models.CharField(db_column='originalName', max_length=100)
    size = models.IntegerField(blank=True, null=True)
    type = models.CharField(max_length=40, blank=True, null=True)
    file = models.CharField(max_length=1)

    noticeboard = models.ForeignKey(
        "Noticeboard",
        db_column="noticeboardId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'noticeboard_files'


class NoticeboardClasses(models.Model):
    school = models.ForeignKey(
        'School',
        db_column="schoolId",
        on_delete=models.CASCADE,
    )

    noticeboard = models.ForeignKey(
        'Noticeboard',
        db_column="noticeId",
        on_delete=models.CASCADE,
    )

    class_list = models.ForeignKey(
        "lessons.ClassList",
        db_column="classId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'noticeboardclasses'


class Policy(models.Model):
    section = models.IntegerField(blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    sequence = models.IntegerField(blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(
        db_column='createdAt', blank=True, null=True)
    title = models.CharField(max_length=100)
    begin_date = models.DateTimeField(
        db_column='beginDate', blank=True, null=True)
    end_date = models.DateTimeField(db_column='endDate', blank=True, null=True)

    school = models.ForeignKey(
        'School',
        db_column="schoolId",
        on_delete=models.CASCADE,
    )

    owner = models.ForeignKey(
        'User',
        db_column="ownerId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'policies_pages'


class PoliciesFiles(models.Model):
    resource_id = models.CharField(db_column='resourceId', max_length=100)
    name = models.CharField(max_length=100, blank=True, null=True)

    policy = models.ForeignKey(
        'Policy',
        db_column="policyId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'policies_files'


class PoliciesLog(models.Model):
    action = models.CharField(max_length=50, blank=True, null=True)
    date = models.DateTimeField(blank=True, null=True)

    policy = models.ForeignKey(
        'Policy',
        db_column="policiesId",
        on_delete=models.CASCADE,
    )

    user = models.ForeignKey(
        'User',
        db_column="userId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'policies_log'


class RememberToken(models.Model):
    created_at = models.DateTimeField(
        db_column='createdAt', blank=True, null=True)
    token = models.CharField(max_length=300, blank=True, null=True)

    user = models.ForeignKey(
        'User',
        db_column="userId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'remember_token'


class ResourceProperty(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    type = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'resource_property'


class Resource(models.Model):
    resource_id = models.CharField(db_column='resourceId', max_length=100)
    name = models.CharField(max_length=100, blank=True, null=True)

    homework = models.ForeignKey(
        'homeworks.Homework',
        db_column="homeworkId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'resources'


class School(models.Model):
    school_id = models.AutoField(db_column='schoolID', primary_key=True)
    name = models.CharField(db_column='SchoolName', max_length=35)
    address1 = models.CharField(db_column='Address1', max_length=100)
    address2 = models.CharField(
        db_column='Address2', max_length=100, blank=True, null=True)
    postcode = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=50)
    phone = models.CharField(max_length=30, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    head_teacher = models.IntegerField(
        db_column='headTeacher', blank=True, null=True)
    access_code = models.CharField(
        db_column='AccessCode', max_length=8, blank=True, null=True)
    teacher_accesscode = models.CharField(
        db_column='TeacherAccessCode', max_length=8, blank=True, null=True)
    allty = models.IntegerField(db_column='allTY', blank=True, null=True)
    client_id = models.CharField(
        db_column='clientId', max_length=100, blank=True, null=True)
    language = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateField(db_column='createdAt', blank=True, null=True)
    timezone = models.CharField(max_length=50, blank=True, null=True)
    website = models.CharField(max_length=100, blank=True, null=True)
    mission_statement = models.TextField(
        db_column='missionStatement', blank=True, null=True)

    avatar = models.ForeignKey(
        'Avatar',
        db_column="avatarId",
        on_delete=models.CASCADE,
    )

    def get_avatar(self):
        file_path = "{}img/thumb/{}".format(
            settings.MEDIA_URL, self.avatar.name)

        if os.path.exists(file_path):
            return "{}img/school-default.png".format(settings.STATIC_URL)

        return file_path

    def __str__(self):
        return self.name

    class Meta:
        managed = False
        db_table = 'schoolinfo'


class SchoolVendor(models.Model):
    vendor_id = models.CharField(
        db_column='vendorId', max_length=30, blank=True, null=True)
    config = models.TextField()

    school = models.ForeignKey(
        'School',
        db_column="schoolId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'schoolvendors'


class SuccessLogin(models.Model):
    ip_address = models.CharField(
        db_column='ipAddress', max_length=15, blank=True, null=True)
    user_agent = models.CharField(
        db_column='userAgent', max_length=300, blank=True, null=True)
    logged_at = models.DateTimeField(
        db_column='loggedAt', blank=True, null=True)

    user = models.ForeignKey(
        'User',
        db_column="userId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'success_login'


class TimetableLog(models.Model):
    date = models.DateTimeField()
    timetable = models.IntegerField()

    school = models.ForeignKey(
        'School',
        db_column="schoolId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'timetable_log'


class TimetableChange(models.Model):
    student = models.ForeignKey(
        'User',
        db_column="studentID",
        on_delete=models.CASCADE,
    )

    lesson = models.ForeignKey(
        'lessons.Lesson',
        db_column="slotId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'timetablechanges'


class TimetableConfig(models.Model):
    start_time = models.CharField(
        db_column='startTime', max_length=8, blank=True, null=True)
    end_time = models.CharField(
        db_column='endTime', max_length=8, blank=True, null=True)
    preset = models.CharField(
        db_column='Preset', max_length=20, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    week_day = models.IntegerField(db_column='weekDay', blank=True, null=True)
    sequence = models.IntegerField(blank=True, null=True)
    is_preset = models.IntegerField(
        db_column='isPreset', blank=True, null=True)

    school = models.ForeignKey(
        'School',
        db_column="schoolID",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'timetableconfig'


class UserToken(models.Model):
    created_at = models.DateTimeField(
        db_column='createdAt', blank=True, null=True)
    token = models.CharField(max_length=300, blank=True, null=True)
    type = models.IntegerField()

    user = models.ForeignKey(
        'User',
        db_column="userId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'user_token'


class User(models.Model):
    user_id = models.AutoField(db_column='userID', primary_key=True)
    school = models.ForeignKey(
        'School',
        db_column="schoolID",
        on_delete=models.CASCADE,
    )

    avatar = models.ForeignKey(
        'Avatar',
        db_column="photoId",
        on_delete=models.CASCADE,
    )

    classes = models.ManyToManyField(
        "lessons.ClassList",
        through="lessons.ClassListOfUsers",
        through_fields=("student", "class_list"))

    name = models.CharField(db_column='FirstName', max_length=35)
    last_name = models.CharField(db_column='LastName', max_length=35)
    type = models.CharField(db_column='Type', max_length=1)
    email = models.CharField(max_length=100, blank=True, null=True)
    password = models.CharField(max_length=60)
    title = models.CharField(max_length=4, blank=True, null=True)
    username = models.CharField(max_length=60, blank=True, null=True)
    token = models.CharField(max_length=500, blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    is_admin = models.IntegerField(db_column='isAdmin', blank=True, null=True)
    created_at = models.DateField(db_column='createdAt', blank=True, null=True)
    guardianaccesscode = models.CharField(
        db_column='guardianAccessCode', max_length=8, blank=True, null=True)
    external_id = models.CharField(
        db_column='externalId', max_length=100, blank=True, null=True)

    def is_guardian(self):
        return self.type == "G"

    def is_teacher(self):
        return self.type == "T"

    def is_student(self):
        return self.type == "P"

    def full_name(self):
        return "{} {}".format(self.name, self.last_name)

    def get_avatar(self):
        file_path = "{}img/thumb/{}".format(
            settings.MEDIA_URL, self.avatar.name)

        if os.path.exists(file_path):
            return "{}img/avatar-default.png".format(settings.STATIC_URL)

        return file_path

    def get_classes(self):
        if self.is_teacher():
            return self.classlist_set.filter(cohort__year=2015)

        if self.is_student():
            return self.classes.filter(cohort__year=2015)

    def __str__(self):
        return self.full_name()

    class Meta:
        managed = False
        db_table = 'users'


class VendorToken(models.Model):
    created_at = models.DateTimeField(
        db_column='createdAt', blank=True, null=True)
    updated_at = models.DateTimeField(
        db_column='updatedAt', blank=True, null=True)
    vendor = models.CharField(max_length=100, blank=True, null=True)
    token = models.CharField(max_length=1000, blank=True, null=True)

    user = models.ForeignKey(
        'User',
        db_column="userId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'vendor_token'
