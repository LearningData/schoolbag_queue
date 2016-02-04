# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from __future__ import unicode_literals
from django.db import models


class DjangoMigrations(models.Model):
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class Friends(models.Model):
    teacherfrom = models.IntegerField(db_column='TeacherFrom')  # Field name made lowercase.
    teacherto = models.IntegerField(db_column='TeacherTo')  # Field name made lowercase.
    verified = models.IntegerField(db_column='Verified')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'friends'


class Links(models.Model):
    schoolid = models.IntegerField(db_column='schoolID')  # Field name made lowercase.
    display = models.CharField(max_length=15)
    link = models.TextField()

    class Meta:
        managed = False
        db_table = 'links'
        unique_together = (('schoolid', 'display'),)


class Notes(models.Model):
    schoolid = models.IntegerField(db_column='schoolID')  # Field name made lowercase.
    studentid = models.IntegerField(db_column='studentID')  # Field name made lowercase.
    timeslotid = models.IntegerField(db_column='timeslotID')  # Field name made lowercase.
    date = models.DateField()
    text = models.CharField(max_length=100)
    status = models.IntegerField()
    classid = models.IntegerField(db_column='classID')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'notes'
        unique_together = (('schoolid', 'studentid', 'timeslotid', 'date'),)


class Pnotes(models.Model):
    schoolid = models.IntegerField(db_column='schoolID')  # Field name made lowercase.
    studentid = models.IntegerField(db_column='studentID')  # Field name made lowercase.
    timeslotid = models.IntegerField(db_column='timeslotID')  # Field name made lowercase.
    date = models.DateField()
    text = models.CharField(max_length=100)
    status = models.IntegerField()
    classid = models.IntegerField(db_column='classID')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'pnotes'
        unique_together = (('schoolid', 'studentid', 'timeslotid', 'date'),)


class Posts(models.Model):
    schoolid = models.IntegerField(db_column='schoolID')  # Field name made lowercase.
    topicid = models.IntegerField(db_column='topicID')  # Field name made lowercase.
    date = models.DateTimeField()
    text = models.CharField(max_length=255)
    postowner = models.IntegerField(db_column='postOwner')  # Field name made lowercase.
    fileattached = models.CharField(db_column='fileAttached', max_length=100, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'posts'


class Present(models.Model):
    schoolid = models.IntegerField(db_column='schoolID')  # Field name made lowercase.
    studentid = models.IntegerField(db_column='studentID')  # Field name made lowercase.
    date = models.DateField()
    present = models.IntegerField()
    timeslotid = models.CharField(db_column='timeslotID', max_length=4)  # Field name made lowercase.
    notes = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = 'present'


class Topics(models.Model):
    schoolid = models.IntegerField(db_column='schoolID')  # Field name made lowercase.
    topicid = models.AutoField(db_column='topicID', primary_key=True)  # Field name made lowercase.
    date = models.DateTimeField()
    title = models.CharField(max_length=30)
    text = models.CharField(max_length=255)
    topicowner = models.IntegerField(db_column='topicOwner')  # Field name made lowercase.
    fileattached = models.CharField(db_column='fileAttached', max_length=100, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'topics'


class UserPhoto(models.Model):
    name = models.CharField(max_length=100)
    size = models.IntegerField(blank=True, null=True)
    type = models.CharField(max_length=40, blank=True, null=True)
    file = models.CharField(max_length=1)

    class Meta:
        managed = False
        db_table = 'user_photo'


class WorkPointPosts(models.Model):
    schoolid = models.IntegerField(db_column='schoolID')  # Field name made lowercase.
    topicid = models.IntegerField(db_column='topicID')  # Field name made lowercase.
    date = models.DateTimeField()
    text = models.CharField(max_length=1024)
    postowner = models.IntegerField(db_column='postOwner')  # Field name made lowercase.
    fileattached = models.CharField(db_column='fileAttached', max_length=100, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'work_point_posts'


class WorkPointTopics(models.Model):
    schoolid = models.IntegerField(db_column='schoolID')  # Field name made lowercase.
    topicid = models.AutoField(db_column='topicID', primary_key=True)  # Field name made lowercase.
    class_id = models.IntegerField()
    date = models.DateTimeField()
    title = models.CharField(max_length=30)
    text = models.CharField(max_length=1024)
    topicowner = models.IntegerField(db_column='topicOwner')  # Field name made lowercase.
    fileattached = models.CharField(db_column='fileAttached', max_length=100, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'work_point_topics'
