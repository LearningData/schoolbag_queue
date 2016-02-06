from django.core.urlresolvers import reverse
import pytest


class TestIndex:
    @pytest.fixture
    def response(self, client):
        return client.get(reverse('accounts-login'))

    def test_index_return_success(self, response):
        assert 200 == response.status_code

    def test_index_use_index_template(self, response):
        assert response.template_name[0] == 'login.html'
