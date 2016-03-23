from django.db import models
from django.core.exceptions import ObjectDoesNotExist


class ClassList(models.Model):
    class_id = models.AutoField(db_column='classID', primary_key=True)
    extra_ref = models.CharField(db_column='extraRef', max_length=10)
    resource_id = models.CharField(
        db_column='resourceId', max_length=60, blank=True, null=True)
    external_id = models.CharField(
        db_column='externalId', max_length=100, blank=True, null=True)

    school = models.ForeignKey(
        "schools.School",
        db_column="schoolId",
        on_delete=models.CASCADE,
    )

    subject = models.ForeignKey(
        'Subject',
        db_column="subjectID",
        on_delete=models.CASCADE,
    )

    teacher = models.ForeignKey(
        "schools.User",
        db_column="teacherID",
        on_delete=models.CASCADE,
    )

    cohort = models.ForeignKey(
        "schools.Cohort",
        db_column="cohortId",
        on_delete=models.CASCADE,
    )

    students = models.ManyToManyField(
        "schools.User",
        through="ClassListOfUsers",
        through_fields=("class_list", "student"),
        related_name="students")

    teachers = models.ManyToManyField(
        "schools.User",
        through="TeachersTeach",
        through_fields=("class_list", "teacher"),
        related_name="teachers")

    def __str__(self):
        try:
            return "{} {} {}".format(
                self.extra_ref, self.subject.name, self.cohort.stage)
        except ObjectDoesNotExist:
            return "{}".format(
                self.extra_ref)

    class Meta:
        managed = False
        db_table = 'classlist'
        verbose_name = "Class"
        verbose_name_plural = "Classes"


class ClassListOfUsers(models.Model):
    class_list = models.ForeignKey(
        'ClassList',
        db_column="classID",
        on_delete=models.CASCADE,
    )

    student = models.ForeignKey(
        "schools.User",
        db_column="studentID",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        try:
            return str(self.class_list.extra_ref)
        except ObjectDoesNotExist:
            return str(self.class_list_id)

    class Meta:
        managed = False
        db_table = 'classlistofusers'


class SubjectAreas(models.Model):
    area_id = models.IntegerField(db_column='areaId')
    school_id = models.IntegerField(db_column='schoolId')

    subject = models.ForeignKey(
        "schools.School",
        db_column="subjectId",
        on_delete=models.CASCADE,
    )

    cohort = models.ForeignKey(
        "schools.Cohort",
        db_column="cohortId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'subject_areas'


class Subject(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True)
    name = models.CharField(max_length=72, db_column='subject')
    code = models.CharField(max_length=20, blank=True, null=True)

    course = models.ForeignKey(
        "schools.Course",
        db_column="courseId",
        on_delete=models.CASCADE,
    )

    definition = models.ForeignKey(
        'SubjectsDefinition',
        db_column="definitionId",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return self.name

    class Meta:
        managed = False
        db_table = 'subjects'


class SubjectsDefinition(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'subjects_definition'


class TeachersTeach(models.Model):
    class_list = models.ForeignKey(
        'ClassList',
        db_column="classId",
        on_delete=models.CASCADE,
    )

    teacher = models.ForeignKey(
        "schools.User",
        db_column="userId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'teachersteach'


class Lesson(models.Model):
    day = models.IntegerField(db_column='Day')
    room = models.CharField(db_column='Room', max_length=10)

    external_id = models.CharField(
        db_column='externalId', max_length=100, blank=True, null=True)

    school = models.ForeignKey(
        "schools.School",
        db_column="schoolID",
        on_delete=models.CASCADE,
    )

    class_list = models.ForeignKey(
        'ClassList',
        db_column="classID",
        on_delete=models.CASCADE,
    )

    timetable_config = models.ForeignKey(
        "schools.TimetableConfig",
        db_column="timetableConfigId",
        on_delete=models.CASCADE,
    )

    teacher = models.ForeignKey(
        "schools.User",
        db_column="teacherId",
        on_delete=models.CASCADE,
    )

    class Meta:
        managed = False
        db_table = 'lessons'
