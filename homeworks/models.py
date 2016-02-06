from django.db import models

from schools.models import School, User
from lessons.models import ClassList, Lesson


class Homework(models.Model):
    homework_id = models.AutoField(db_column='homeworkID', primary_key=True)
    set_date = models.DateField(db_column='setDate')
    due_date = models.DateField(db_column='dueDate')
    description = models.TextField(db_column='text', blank=True, null=True)
    title = models.CharField(max_length=500, blank=True, null=True)
    owner = models.IntegerField()
    type = models.IntegerField(blank=True, null=True)
    time = models.IntegerField(blank=True, null=True)

    school = models.ForeignKey(
        School,
        db_column="schoolId",
        on_delete=models.CASCADE,
    )

    teacher = models.ForeignKey(
        User,
        db_column="teacherID",
        on_delete=models.CASCADE,
    )

    class_list = models.ForeignKey(
        ClassList,
        db_column="classID",
        on_delete=models.CASCADE,
    )

    lesson = models.ForeignKey(
        Lesson,
        db_column="timeslotID",
        on_delete=models.CASCADE,
    )

    def to_dict(self):
        return {
            "id": self.pk,
            "title": self.title,
            "set_date": self.set_date,
            "due_date": self.due_date,
            "description": self.description,
            "owner": self.owner,
            "type": self.type,
            "time": self.time
        }

    def __str__(self):
        return self.title + " - " + self.teacher.name

    class Meta:
        managed = False
        db_table = 'homework'

class HomeworkFiles(models.Model):
    name = models.CharField(max_length=100)
    original_name = models.CharField(db_column='originalName', max_length=100)
    size = models.IntegerField(blank=True, null=True)
    type = models.CharField(max_length=40, blank=True, null=True)
    file = models.TextField(blank=True, null=True)
    description = models.CharField(max_length=1000, blank=True, null=True)

    homework = models.ForeignKey(
        'Homework',
        db_column="homeworkId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'homework_files'

class HomeworkFeedback(models.Model):
    text = models.TextField(blank=True, null=True)
    added_by = models.IntegerField(db_column='addedBy', blank=True, null=True)

    homework_user = models.ForeignKey(
        'HomeworkUser',
        db_column="homeworkUserId",
        on_delete=models.CASCADE,
    )

    feedback = models.ForeignKey(
        'FeedbackSet',
        db_column="feedbackSetId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'homework_feedback'


class HomeworkLinks(models.Model):
    link = models.CharField(max_length=500, blank=True, null=True)

    homework = models.ForeignKey(
        'Homework',
        db_column="homeworkId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'homework_links'


class HomeworkLog(models.Model):
    action = models.IntegerField()
    date = models.DateTimeField()

    homework = models.ForeignKey(
        'Homework',
        db_column="homeworkId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'homework_log'


class HomeworkUser(models.Model):
    text = models.TextField(blank=True, null=True)
    status = models.IntegerField()

    submitted_at = models.DateTimeField(
        db_column='submittedDate', blank=True, null=True)

    reviewed_at = models.DateTimeField(
        db_column='reviewedDate', blank=True, null=True)

    info = models.ForeignKey(
        'Homework',
        db_column="homeworkId",
        on_delete=models.CASCADE,
    )

    student = models.ForeignKey(
        User,
        db_column="studentId",
        on_delete=models.CASCADE,
    )

    def to_dict(self):
        return {
            "id": self.pk,
            "subject": self.info.class_list.subject.name,
            "description": self.info.description,
            "title": self.info.title,
            "status": self.status,
            "student": self.student.full_name(),
            "due-date": self.info.due_date,
            "hasPeriod": False,
            "period": "",
        }

    class Meta:
        managed = False
        db_table = 'homework_user'


class FeedbackSet(models.Model):
    icon = models.TextField(blank=True, null=True)
    set_name = models.CharField(
        db_column='setName', max_length=60, blank=True, null=True)
    short_description = models.CharField(
        db_column='shortDescription', max_length=45, blank=True, null=True)
    long_description = models.CharField(
        db_column='longDescription', max_length=240, blank=True, null=True)
    value = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'feedback_set'


class OneNoteLinks(models.Model):
    type = models.CharField(max_length=1)
    schoolbag_id = models.IntegerField(db_column='schoolbagId')
    url = models.CharField(max_length=600, blank=True, null=True)
    onenote_id = models.CharField(db_column='oneNoteId', max_length=100, blank=True, null=True)
    content = models.TextField(db_column='pageContent', blank=True, null=True)
    table = models.CharField(db_column='schoolbagTable', max_length=15, blank=True, null=True)
    client_url = models.CharField(db_column='clientUrl', max_length=600, blank=True, null=True)

    user = models.ForeignKey(
        User,
        db_column="userId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'one_note_links'