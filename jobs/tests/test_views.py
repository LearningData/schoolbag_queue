from django.core.urlresolvers import reverse
import pytest


class TestLogHomework:
    @pytest.fixture
    def response(self, client):
        params = {"homework_id": 1, "date": "", "status": 1, "key": "test"}
        return client.post(reverse('log-homework'), params)

    def test_log_return_success(self, response):
        assert 200 == response.status_code

    def test_log_return_unauthorized(self, client):
        assert 401 == self._post(client, {}).status_code

    def _post(self, client, params):
        return client.post(reverse('log-homework'), params)