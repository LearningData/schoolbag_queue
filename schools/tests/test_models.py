import pytest
from schools.models import User, School

class TestUser:
    @pytest.fixture
    def user(self):
        return User(name="name", last_name="surname")

    def test_full_name(self, user):
        assert user.full_name() == "{} {}".format(user.name, user.last_name)

    def test_object_repr(self, user):
        assert str(user) == "{} {}".format(user.name, user.last_name)

    def test_is_student_returns_false(self, user):
        assert not user.is_student()

    def test_is_student_returns_true(self, user):
        user.type = "P"
        assert user.is_student() == True

    def test_is_teacher_returns_false(self, user):
        assert not user.is_teacher()

    def test_is_teacher_returns_true(self, user):
        user.type = "T"
        assert user.is_teacher() == True

    def test_is_guardian_returns_false(self, user):
        assert not user.is_guardian()

    def test_is_guardian_returns_true(self, user):
        user.type = "G"
        assert user.is_guardian() == True

class TestSchool:
    def test_school_repr(self):
        school = School(name="School Name")
        assert str(school) == school.name